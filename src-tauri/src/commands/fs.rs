use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::OnceLock;
use std::time::SystemTime;

static WSL_CACHE: OnceLock<Vec<WslDistro>> = OnceLock::new();
static DRIVES_CACHE: OnceLock<Vec<DriveInfo>> = OnceLock::new();

#[derive(Debug, Serialize)]
pub struct UserDirs {
    pub home: String,
    pub desktop: Option<String>,
    pub documents: Option<String>,
    pub downloads: Option<String>,
    pub pictures: Option<String>,
    pub music: Option<String>,
    pub videos: Option<String>,
}

#[tauri::command]
pub fn get_user_dirs() -> Result<UserDirs, String> {
    let home = dirs::home_dir()
        .ok_or("Cannot determine home directory")?;

    Ok(UserDirs {
        home: home.to_string_lossy().to_string(),
        desktop: dirs::desktop_dir().map(|p| p.to_string_lossy().to_string()),
        documents: dirs::document_dir().map(|p| p.to_string_lossy().to_string()),
        downloads: dirs::download_dir().map(|p| p.to_string_lossy().to_string()),
        pictures: dirs::picture_dir().map(|p| p.to_string_lossy().to_string()),
        music: dirs::audio_dir().map(|p| p.to_string_lossy().to_string()),
        videos: dirs::video_dir().map(|p| p.to_string_lossy().to_string()),
    })
}

#[derive(Debug, Serialize, Clone)]
pub struct WslDistro {
    pub name: String,
    pub path: String,
}

fn detect_wsl_distros() -> Vec<WslDistro> {
    let mut distros = Vec::new();

    for base in &["\\\\wsl.localhost", "\\\\wsl$"] {
        let base_path = PathBuf::from(base);
        if let Ok(entries) = fs::read_dir(&base_path) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let path = entry.path().to_string_lossy().to_string();
                if !distros.iter().any(|d: &WslDistro| d.name == name) {
                    distros.push(WslDistro { name, path });
                }
            }
        }
    }

    if distros.is_empty() {
        if let Ok(output) = Command::new("wsl")
            .args(["--list", "--quiet"])
            .output()
        {
            if output.status.success() {
                let text = String::from_utf16_lossy(
                    &output
                        .stdout
                        .chunks_exact(2)
                        .map(|c| u16::from_le_bytes([c[0], c[1]]))
                        .collect::<Vec<u16>>(),
                );
                for line in text.lines() {
                    let name = line.trim().to_string();
                    if name.is_empty() {
                        continue;
                    }
                    let path = format!("\\\\wsl.localhost\\{}", name);
                    let alt_path = format!("\\\\wsl$\\{}", name);
                    let final_path = if PathBuf::from(&path).exists() {
                        path
                    } else {
                        alt_path
                    };
                    if !distros.iter().any(|d: &WslDistro| d.name == name) {
                        distros.push(WslDistro {
                            name,
                            path: final_path,
                        });
                    }
                }
            }
        }
    }

    distros
}

#[tauri::command]
pub fn get_wsl_distros() -> Vec<WslDistro> {
    WSL_CACHE.get_or_init(detect_wsl_distros).clone()
}

#[derive(Debug, Serialize, Clone)]
pub struct DriveInfo {
    pub letter: String,
    pub path: String,
    pub label: Option<String>,
}

fn detect_drives() -> Vec<DriveInfo> {
    let mut drives = Vec::new();

    #[cfg(target_os = "windows")]
    {
        for letter in b'A'..=b'Z' {
            let drive_path = format!("{}:\\", letter as char);
            let path = PathBuf::from(&drive_path);
            if path.exists() {
                drives.push(DriveInfo {
                    letter: format!("{}:", letter as char),
                    path: drive_path,
                    label: None,
                });
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        if let Ok(entries) = fs::read_dir("/mnt") {
            for entry in entries.flatten() {
                if entry.path().is_dir() {
                    let name = entry.file_name().to_string_lossy().to_string();
                    drives.push(DriveInfo {
                        letter: name.clone(),
                        path: entry.path().to_string_lossy().to_string(),
                        label: Some(name),
                    });
                }
            }
        }
    }

    drives
}

#[tauri::command]
pub fn get_drives() -> Vec<DriveInfo> {
    DRIVES_CACHE.get_or_init(detect_drives).clone()
}

#[derive(Debug, Serialize, Clone)]
pub struct FileEntry {
    pub id: String,
    pub name: String,
    pub kind: String,
    pub size: Option<String>,
    pub modified: Option<String>,
    pub is_dir: bool,
    pub path: String,
    pub children: Option<Vec<FileEntry>>,
}

fn format_size(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else if bytes < 1024 * 1024 * 1024 {
        format!("{:.1} MB", bytes as f64 / (1024.0 * 1024.0))
    } else {
        format!("{:.1} GB", bytes as f64 / (1024.0 * 1024.0 * 1024.0))
    }
}

fn format_time(time: SystemTime) -> String {
    let datetime: chrono::DateTime<chrono::Local> = time.into();
    datetime.format("%b %d, %Y").to_string()
}

fn detect_kind(path: &Path, is_dir: bool) -> String {
    if is_dir {
        return "folder".to_string();
    }
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();
    match ext.as_str() {
        "jpg" | "jpeg" | "png" | "gif" | "bmp" | "svg" | "webp" | "ico" | "heic" | "heif"
        | "tiff" | "tif" | "avif" => "image".to_string(),
        "pdf" => "pdf".to_string(),
        "rs" | "ts" | "tsx" | "js" | "jsx" | "py" | "go" | "java" | "c" | "cpp" | "h" | "hpp"
        | "rb" | "php" | "swift" | "kt" | "cs" | "lua" | "zig" | "hs" | "ml" | "ex" | "exs"
        | "sh" | "bash" | "zsh" | "fish" | "ps1" | "toml" | "yaml" | "yml" | "json" | "xml"
        | "html" | "css" | "scss" | "sass" | "less" | "sql" | "graphql" | "proto" | "wasm"
        | "Makefile" | "Dockerfile" | "bib" => "code".to_string(),
        "txt" | "md" | "markdown" | "rst" | "org" | "tex" | "log" | "csv" | "tsv" => {
            "text".to_string()
        }
        "mp3" | "wav" | "flac" | "aac" | "ogg" | "m4a" | "wma" | "opus" | "aiff" => {
            "audio".to_string()
        }
        "mp4" | "avi" | "mkv" | "mov" | "wmv" | "flv" | "webm" | "m4v" | "3gp" => {
            "video".to_string()
        }
        "zip" | "tar" | "gz" | "bz2" | "xz" | "7z" | "rar" | "zst" | "lz4" => {
            "archive".to_string()
        }
        "doc" | "docx" | "odt" | "rtf" => "doc".to_string(),
        "xls" | "xlsx" | "ods" | "numbers" => "sheet".to_string(),
        _ => "file".to_string(),
    }
}

fn path_to_id(path: &Path) -> String {
    // Use a stable hash of the path as the id
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    path.hash(&mut hasher);
    format!("f{:x}", hasher.finish())
}

#[tauri::command]
pub fn read_dir(path: String, show_hidden: bool) -> Result<Vec<FileEntry>, String> {
    let dir_path = PathBuf::from(&path);
    if !dir_path.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    // Collect entries with pre-computed sort keys to avoid repeated allocations
    let read = fs::read_dir(&dir_path).map_err(|e| format!("Cannot read directory: {}", e))?;
    let mut sortable: Vec<(String, FileEntry)> = Vec::new();

    for entry in read.flatten() {
        let name = entry.file_name().to_string_lossy().to_string();

        if !show_hidden && name.starts_with('.') {
            continue;
        }

        let entry_path = entry.path();

        // Use file_type() first (no extra stat on most platforms), fall back to metadata
        let file_type = match entry.file_type() {
            Ok(ft) => ft,
            Err(_) => continue,
        };
        let is_dir = file_type.is_dir();

        // Only call metadata() once, and only when we need size/modified
        let (size, modified) = if is_dir {
            (None, entry.metadata().ok().and_then(|m| m.modified().ok()).map(format_time))
        } else {
            match entry.metadata() {
                Ok(m) => (
                    Some(format_size(m.len())),
                    m.modified().ok().map(format_time),
                ),
                Err(_) => (None, None),
            }
        };

        let kind = detect_kind(&entry_path, is_dir);
        let id = path_to_id(&entry_path);
        let sort_key = name.to_lowercase();

        sortable.push((sort_key, FileEntry {
            id,
            name,
            kind,
            size,
            modified,
            is_dir,
            path: entry_path.to_string_lossy().to_string(),
            children: None,
        }));
    }

    // Sort: folders first, then by pre-computed lowercase name (no allocations in comparator)
    sortable.sort_by(|a, b| {
        match (a.1.is_dir, b.1.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.0.cmp(&b.0),
        }
    });

    let entries: Vec<FileEntry> = sortable.into_iter().map(|(_, e)| e).collect();

    Ok(entries)
}

#[tauri::command]
pub fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Cannot determine home directory".to_string())
}

#[tauri::command]
pub fn get_file_meta(path: String) -> Result<FileEntry, String> {
    let file_path = PathBuf::from(&path);
    let metadata = fs::metadata(&file_path)
        .map_err(|e| format!("Cannot read metadata: {}", e))?;

    let is_dir = metadata.is_dir();
    let name = file_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_default();

    let size = if is_dir {
        None
    } else {
        Some(format_size(metadata.len()))
    };

    let modified = metadata.modified().ok().map(format_time);
    let kind = detect_kind(&file_path, is_dir);
    let id = path_to_id(&file_path);

    Ok(FileEntry {
        id,
        name,
        kind,
        size,
        modified,
        is_dir,
        path: file_path.to_string_lossy().to_string(),
        children: None,
    })
}

fn copy_dir_recursive(src: &Path, dst: &Path) -> Result<(), String> {
    fs::create_dir_all(dst).map_err(|e| format!("Failed to create directory: {}", e))?;
    for entry in fs::read_dir(src).map_err(|e| format!("Failed to read directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let src_path = entry.path();
        let dst_path = dst.join(entry.file_name());
        if src_path.is_dir() {
            copy_dir_recursive(&src_path, &dst_path)?;
        } else {
            fs::copy(&src_path, &dst_path)
                .map_err(|e| format!("Failed to copy file: {}", e))?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn copy_path(source: String, dest_dir: String) -> Result<String, String> {
    let src = PathBuf::from(&source);
    let name = src.file_name().ok_or("Invalid source path")?.to_owned();
    let dest = PathBuf::from(&dest_dir).join(&name);

    // If destination exists, add a suffix
    let dest = if dest.exists() {
        let stem = dest.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
        let ext = dest.extension().and_then(|e| e.to_str());
        let mut i = 1;
        loop {
            let new_name = if let Some(ext) = ext {
                format!("{} ({}). {}", stem, i, ext)
            } else {
                format!("{} ({})", stem, i)
            };
            let candidate = PathBuf::from(&dest_dir).join(&new_name);
            if !candidate.exists() { break candidate; }
            i += 1;
        }
    } else {
        dest
    };

    if src.is_dir() {
        copy_dir_recursive(&src, &dest)?;
    } else {
        fs::copy(&src, &dest).map_err(|e| format!("Copy failed: {}", e))?;
    }
    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
pub fn move_path(source: String, dest_dir: String) -> Result<String, String> {
    let src = PathBuf::from(&source);
    let name = src.file_name().ok_or("Invalid source path")?.to_owned();
    let dest = PathBuf::from(&dest_dir).join(&name);
    fs::rename(&src, &dest).map_err(|e| format!("Move failed: {}", e))?;
    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
pub fn trash_path(path: String) -> Result<(), String> {
    trash::delete(&path).map_err(|e| format!("Failed to move to trash: {}", e))?;
    Ok(())
}
