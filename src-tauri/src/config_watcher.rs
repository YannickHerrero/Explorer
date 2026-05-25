//! Watches the user's config.json on disk and re-emits the parsed AppConfig
//! to the frontend whenever it changes.
//!
//! This is what makes external theme switches (e.g. the wmenu ecosystem
//! theme orchestrator) take effect on a running Explorer instance without
//! needing a restart. The frontend listens for the "config-changed" event
//! and swaps its in-memory AppConfig state — CSS variables react on the next
//! render.

use std::path::PathBuf;
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

use notify::event::EventKind;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use tauri::{AppHandle, Emitter, Manager};

use crate::commands::config::AppConfig;

/// Debounce window. notify on Windows often fires several events per logical
/// save (write + metadata + rename of a temp file). Coalescing into a single
/// emit avoids hammering the frontend.
const DEBOUNCE: Duration = Duration::from_millis(150);

const EVENT_NAME: &str = "config-changed";

/// Spawn the watcher thread. Logs and returns silently if anything along
/// the path fails — the app should keep running without external reload.
pub fn spawn(app: &AppHandle) {
    let Some(config_dir) = app.path().app_config_dir().ok() else {
        eprintln!("config_watcher: app_config_dir unavailable, skipping watcher");
        return;
    };

    if let Err(err) = std::fs::create_dir_all(&config_dir) {
        eprintln!("config_watcher: cannot create {}: {err}", config_dir.display());
        return;
    }

    let config_path = config_dir.join("config.json");
    let app_handle = app.clone();

    thread::Builder::new()
        .name("config-watcher".into())
        .spawn(move || run(app_handle, config_dir, config_path))
        .ok();
}

fn run(app: AppHandle, dir: PathBuf, file: PathBuf) {
    let (tx, rx) = mpsc::channel::<notify::Result<Event>>();
    let mut watcher = match RecommendedWatcher::new(tx, notify::Config::default()) {
        Ok(w) => w,
        Err(err) => {
            eprintln!("config_watcher: cannot create watcher: {err}");
            return;
        }
    };

    if let Err(err) = watcher.watch(&dir, RecursiveMode::NonRecursive) {
        eprintln!("config_watcher: cannot watch {}: {err}", dir.display());
        return;
    }

    loop {
        // Block until we see at least one relevant event.
        let Ok(first) = rx.recv() else {
            break;
        };
        if !is_relevant(&first, &file) {
            continue;
        }
        // Drain any further events within the debounce window so several
        // notify pings from a single logical save coalesce into one emit.
        while rx.recv_timeout(DEBOUNCE).is_ok() {}

        emit_current(&app, &file);
    }
}

fn is_relevant(ev: &notify::Result<Event>, file: &PathBuf) -> bool {
    let Ok(ev) = ev else { return false };
    matches!(
        ev.kind,
        EventKind::Create(_) | EventKind::Modify(_) | EventKind::Remove(_)
    ) && ev.paths.iter().any(|p| p == file)
}

fn emit_current(app: &AppHandle, file: &PathBuf) {
    let Ok(text) = std::fs::read_to_string(file) else {
        // Transient miss (e.g. atomic-replace between rename and rename-back)
        // — drop quietly; the next event will catch it.
        return;
    };
    match serde_json::from_str::<AppConfig>(&text) {
        Ok(cfg) => {
            if let Err(err) = app.emit(EVENT_NAME, &cfg) {
                eprintln!("config_watcher: emit failed: {err}");
            }
        }
        Err(err) => {
            eprintln!("config_watcher: parse failed: {err}");
        }
    }
}
