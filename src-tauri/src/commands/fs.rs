use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

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

#[derive(Debug, Serialize)]
pub struct WslDistro {
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub fn get_wsl_distros() -> Vec<WslDistro> {
    let mut distros = Vec::new();

    // WSL filesystems are at \\wsl.localhost\ or \\wsl$\
    for base in &["\\\\wsl.localhost", "\\\\wsl$"] {
        let base_path = PathBuf::from(base);
        if let Ok(entries) = fs::read_dir(&base_path) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                let path = entry.path().to_string_lossy().to_string();
                // Avoid duplicates
                if !distros.iter().any(|d: &WslDistro| d.name == name) {
                    distros.push(WslDistro { name, path });
                }
            }
        }
    }

    distros
}

#[derive(Debug, Serialize)]
pub struct DriveInfo {
    pub letter: String,
    pub path: String,
    pub label: Option<String>,
}

#[tauri::command]
pub fn get_drives() -> Vec<DriveInfo> {
    let mut drives = Vec::new();

    // On Windows, check common drive letters
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

    // On Linux, list mount points (useful for testing)
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

    let mut entries: Vec<FileEntry> = Vec::new();

    let read = fs::read_dir(&dir_path).map_err(|e| format!("Cannot read directory: {}", e))?;

    for entry in read {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().to_string();

        // Skip hidden files unless requested
        if !show_hidden && name.starts_with('.') {
            continue;
        }

        let entry_path = entry.path();
        let metadata = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let is_dir = metadata.is_dir();
        let size = if is_dir {
            None
        } else {
            Some(format_size(metadata.len()))
        };

        let modified = metadata
            .modified()
            .ok()
            .map(format_time);

        let kind = detect_kind(&entry_path, is_dir);
        let id = path_to_id(&entry_path);

        entries.push(FileEntry {
            id,
            name,
            kind,
            size,
            modified,
            is_dir,
            path: entry_path.to_string_lossy().to_string(),
            children: None,
        });
    }

    // Sort: folders first, then alphabetically (case-insensitive)
    entries.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
        }
    });

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

    let children = if is_dir {
        // Return child count info but not full listing
        let count = fs::read_dir(&file_path)
            .map(|rd| rd.count())
            .unwrap_or(0);
        // We don't populate children here — the frontend calls read_dir separately
        let _ = count;
        None
    } else {
        None
    };

    Ok(FileEntry {
        id,
        name,
        kind,
        size,
        modified,
        is_dir,
        path: file_path.to_string_lossy().to_string(),
        children,
    })
}
