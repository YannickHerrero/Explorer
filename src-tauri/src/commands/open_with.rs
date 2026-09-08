//! "Open with" support, backed by the Windows shell association handlers.
//!
//! Enumeration and launching both go through `IAssocHandler` rather than spawning an
//! executable directly. Packaged (MSIX/Store) apps such as Photos register only a
//! `DelegateExecute` COM handler and leave `shell\open\command` empty, so there is no
//! command line for `Command::new(exe).arg(path)` to run.

use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct OpenWithHandler {
    /// Opaque, of the form "<enumeration index>|<command>". Passed back to `open_with_handler`.
    pub id: String,
    pub name: String,
    /// Executable path or package moniker. For display and matching only, never to spawn.
    pub command: String,
    pub icon_path: Option<String>,
    /// May be negative, in which case it is a resource id rather than an offset.
    pub icon_index: i32,
    pub is_recommended: bool,
}

/// The shell work runs on the blocking pool: a plain `#[tauri::command]` would run on the
/// main thread and stall the event loop, and `#[tauri::command(async)]` would tie up a
/// tokio worker for as long as the (potentially very long-lived) dialog stays open.
#[tauri::command]
pub async fn list_open_with_handlers(path: String) -> Result<Vec<OpenWithHandler>, String> {
    tauri::async_runtime::spawn_blocking(move || imp::list(&path))
        .await
        .map_err(|e| format!("Failed to run Open With enumeration: {}", e))?
}

#[tauri::command]
pub async fn open_with_handler(path: String, handler_id: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || imp::invoke(&path, &handler_id))
        .await
        .map_err(|e| format!("Failed to run Open With invocation: {}", e))?
}

/// Shows the native "Open with" dialog. Returns `false` when the user cancelled.
#[tauri::command]
pub async fn open_with_dialog(window: tauri::Window, path: String) -> Result<bool, String> {
    // HWND is a raw pointer and therefore !Send, so it crosses to the worker as an integer.
    #[cfg(windows)]
    let parent = window
        .hwnd()
        .map(|h| h.0 as isize)
        .map_err(|e| format!("Failed to get window handle: {}", e))?;
    #[cfg(not(windows))]
    let parent = {
        let _ = &window;
        0isize
    };

    tauri::async_runtime::spawn_blocking(move || imp::dialog(&path, parent))
        .await
        .map_err(|e| format!("Failed to run Open With dialog: {}", e))?
}

#[cfg(windows)]
mod imp {
    use super::OpenWithHandler;
    use std::path::Path;

    use windows::core::{Error as WinError, HRESULT, PCWSTR, PWSTR};
    use windows::Win32::Foundation::{ERROR_CANCELLED, HWND, RPC_E_CHANGED_MODE, S_OK};
    use windows::Win32::System::Com::{
        CoInitializeEx, CoTaskMemFree, CoUninitialize, IBindCtx, IDataObject,
        COINIT_APARTMENTTHREADED,
    };
    use windows::Win32::UI::Shell::{
        IAssocHandler, IShellItem, SHAssocEnumHandlers, SHCreateItemFromParsingName,
        SHOpenWithDialog, ASSOC_FILTER, ASSOC_FILTER_NONE, BHID_DataObject, OAIF_EXEC, OPENASINFO,
    };

    /// Must match between `list` and `invoke`, otherwise the indexes baked into the handler
    /// ids refer to a different enumeration.
    const FILTER: ASSOC_FILTER = ASSOC_FILTER_NONE;
    const MAX_HANDLERS: usize = 64;

    /// Puts the current thread in a single-threaded apartment and balances it on drop. The
    /// shell association APIs display UI and load in-process shell extensions, so they
    /// require STA rather than MTA.
    struct ComGuard {
        initialized_here: bool,
    }

    impl ComGuard {
        fn new() -> Result<Self, String> {
            let hr = unsafe { CoInitializeEx(None, COINIT_APARTMENTTHREADED) };
            if hr == RPC_E_CHANGED_MODE {
                // The thread is already an MTA. The calls still work, but we did not
                // increment the counter so we must not decrement it either.
                Ok(Self {
                    initialized_here: false,
                })
            } else if hr.is_ok() {
                // S_FALSE means "already initialized" and still needs a matching
                // CoUninitialize, so both success codes are treated the same.
                Ok(Self {
                    initialized_here: true,
                })
            } else {
                Err(format!("Failed to initialize COM: {}", WinError::from(hr)))
            }
        }
    }

    impl Drop for ComGuard {
        fn drop(&mut self) {
            if self.initialized_here {
                unsafe { CoUninitialize() };
            }
        }
    }

    fn wide(s: &str) -> Vec<u16> {
        s.encode_utf16().chain(std::iter::once(0)).collect()
    }

    /// # Safety
    /// `p` must be null, or a `CoTaskMemAlloc`-allocated NUL-terminated UTF-16 string whose
    /// ownership passes to this function.
    unsafe fn take_co_string(p: PWSTR) -> Option<String> {
        if p.is_null() {
            return None;
        }
        let s = unsafe { p.to_string() }.ok();
        unsafe { CoTaskMemFree(Some(p.0 as *const core::ffi::c_void)) };
        s
    }

    /// `SHAssocEnumHandlers` rejects a null extension, so directories and extensionless files
    /// have to be reported as "no handlers" instead.
    ///
    /// `Path::extension` returns `None` for dotfiles such as `.gitignore`, whereas the shell
    /// treats the whole name as the extension, hence the second branch.
    fn extension_of(path: &str) -> Option<String> {
        let p = Path::new(path);
        if p.is_dir() {
            return None;
        }
        if let Some(ext) = p.extension().and_then(|e| e.to_str()) {
            return Some(format!(".{}", ext));
        }
        let name = p.file_name()?.to_str()?;
        if name.len() > 1 && name.starts_with('.') && !name[1..].contains('.') {
            Some(name.to_string())
        } else {
            None
        }
    }

    /// Requires COM to be initialized on the calling thread.
    fn enumerate(ext: &str) -> Vec<IAssocHandler> {
        let w = wide(ext);
        // A failure here just means nothing is registered for the extension, and an empty
        // list is a better outcome than an HRESULT surfacing on every right-click.
        let Ok(enumerator) = (unsafe { SHAssocEnumHandlers(PCWSTR(w.as_ptr()), FILTER) }) else {
            return Vec::new();
        };

        let mut handlers = Vec::new();
        let mut slot: [Option<IAssocHandler>; 1] = [None];
        while handlers.len() < MAX_HANDLERS {
            let mut fetched: u32 = 0;
            // Next returns S_FALSE once exhausted, and windows-rs maps every HRESULT >= 0 to
            // Ok, so the loop has to be driven by `fetched` rather than by the Result.
            if unsafe { enumerator.Next(&mut slot, Some(&mut fetched as *mut u32)) }.is_err() {
                break;
            }
            if fetched == 0 {
                break;
            }
            match slot[0].take() {
                Some(handler) => handlers.push(handler),
                None => break,
            }
        }
        handlers
    }

    fn command_of(handler: &IAssocHandler) -> Option<String> {
        unsafe { handler.GetName() }
            .ok()
            .and_then(|p| unsafe { take_co_string(p) })
    }

    fn describe(handler: &IAssocHandler, index: usize) -> OpenWithHandler {
        let command = command_of(handler).unwrap_or_default();

        let ui_name = unsafe { handler.GetUIName() }
            .ok()
            .and_then(|p| unsafe { take_co_string(p) });

        let mut icon_raw = PWSTR::null();
        let mut icon_index: i32 = 0;
        let icon_path =
            if unsafe { handler.GetIconLocation(&mut icon_raw, &mut icon_index) }.is_ok() {
                unsafe { take_co_string(icon_raw) }
            } else {
                None
            };

        // IsRecommended hands back a raw HRESULT: S_OK means recommended, S_FALSE does not.
        let is_recommended = unsafe { handler.IsRecommended() } == S_OK;

        let name = ui_name.unwrap_or_else(|| {
            Path::new(&command)
                .file_name()
                .map(|n| n.to_string_lossy().to_string())
                .unwrap_or_else(|| command.clone())
        });

        OpenWithHandler {
            id: format!("{}|{}", index, command),
            name,
            command,
            icon_path,
            icon_index,
            is_recommended,
        }
    }

    pub fn list(path: &str) -> Result<Vec<OpenWithHandler>, String> {
        let Some(ext) = extension_of(path) else {
            return Ok(Vec::new());
        };
        let _com = ComGuard::new()?;

        let handlers = enumerate(&ext);
        let mut described: Vec<OpenWithHandler> = handlers
            .iter()
            .enumerate()
            .map(|(i, h)| describe(h, i))
            .filter(|h| !h.command.is_empty())
            .collect();

        // Sorting only reorders the presentation: each id still carries the enumeration
        // index, which is what `invoke` re-derives.
        described.sort_by(|a, b| {
            b.is_recommended
                .cmp(&a.is_recommended)
                .then_with(|| a.name.to_lowercase().cmp(&b.name.to_lowercase()))
        });
        Ok(described)
    }

    /// Builds the `IDataObject` the shell expects as the description of the target selection.
    fn data_object_for(path: &str) -> Result<IDataObject, String> {
        let w = wide(path);
        let no_bind_ctx: Option<&IBindCtx> = None;

        let item: IShellItem =
            unsafe { SHCreateItemFromParsingName(PCWSTR(w.as_ptr()), no_bind_ctx) }
                .map_err(|e| format!("Failed to resolve shell item for {}: {}", path, e))?;

        unsafe { item.BindToHandler(no_bind_ctx, &BHID_DataObject) }
            .map_err(|e| format!("Failed to build data object for {}: {}", path, e))
    }

    pub fn invoke(path: &str, handler_id: &str) -> Result<(), String> {
        // '|' is illegal in a Windows path, so it cannot occur inside the command.
        let (index, command) = handler_id
            .split_once('|')
            .ok_or_else(|| format!("Malformed handler id: {}", handler_id))?;
        let index: usize = index
            .parse()
            .map_err(|e| format!("Malformed handler id {}: {}", handler_id, e))?;

        let ext = extension_of(path)
            .ok_or_else(|| format!("No file extension to resolve handlers for: {}", path))?;

        let _com = ComGuard::new()?;
        let handlers = enumerate(&ext);

        // IAssocHandler is !Send and cannot be cached across the IPC boundary, so the list is
        // rebuilt here. The shell may have reordered it in the meantime, since picking an app
        // can promote it to recommended, hence the fallback match on the command.
        let chosen = handlers
            .get(index)
            .filter(|h| command_of(h).as_deref() == Some(command))
            .or_else(|| {
                handlers
                    .iter()
                    .find(|h| command_of(h).as_deref() == Some(command))
            })
            .ok_or_else(|| {
                format!(
                    "This application is no longer registered for {}: {}",
                    ext, command
                )
            })?;

        let data_object = data_object_for(path)?;

        // Invoke rather than CreateInvoker: the latter exists for multi-selection, where
        // SupportsSelection has to be consulted first.
        unsafe { chosen.Invoke(&data_object) }
            .map_err(|e| format!("Failed to open {} with {}: {}", path, command, e))
    }

    pub fn dialog(path: &str, parent_raw: isize) -> Result<bool, String> {
        let _com = ComGuard::new()?;

        let w = wide(path);
        let info = OPENASINFO {
            pcszFile: PCWSTR(w.as_ptr()),
            pcszClass: PCWSTR::null(),
            // OAIF_ALLOW_REGISTRATION and its siblings have been ignored since Windows 10.
            // Without OAIF_EXEC the dialog only points at Settings instead of launching.
            oaifInFlags: OAIF_EXEC,
        };
        let parent = if parent_raw == 0 {
            None
        } else {
            Some(HWND(parent_raw as *mut core::ffi::c_void))
        };

        match unsafe { SHOpenWithDialog(parent, &info) } {
            Ok(()) => Ok(true),
            Err(e) if e.code() == HRESULT::from_win32(ERROR_CANCELLED.0) => Ok(false),
            Err(e) => Err(format!("Open With dialog failed for {}: {}", path, e)),
        }
    }
}

#[cfg(not(windows))]
mod imp {
    use super::OpenWithHandler;

    const UNSUPPORTED: &str = "Open With is only available on Windows";

    pub fn list(_path: &str) -> Result<Vec<OpenWithHandler>, String> {
        Ok(Vec::new())
    }

    pub fn invoke(_path: &str, _handler_id: &str) -> Result<(), String> {
        Err(UNSUPPORTED.to_string())
    }

    pub fn dialog(_path: &str, _parent_raw: isize) -> Result<bool, String> {
        Err(UNSUPPORTED.to_string())
    }
}
