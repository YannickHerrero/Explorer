use serde::Serialize;
use tauri::Manager;

use super::config::{load_config, AppConfig};
use super::fs::{get_drives, get_user_dirs, get_wsl_distros, read_dir, DriveInfo, FileEntry, UserDirs, WslDistro};

#[derive(Debug, Serialize)]
pub struct InitData {
    pub config: AppConfig,
    pub home_path: String,
    pub home_entries: Vec<FileEntry>,
    pub user_dirs: UserDirs,
    pub wsl_distros: Vec<WslDistro>,
    pub drives: Vec<DriveInfo>,
}

#[tauri::command]
pub fn get_init_data(app_handle: tauri::AppHandle) -> Result<InitData, String> {
    let config = load_config(app_handle.clone());

    let home_path = dirs::home_dir()
        .ok_or("Cannot determine home directory")?
        .to_string_lossy()
        .to_string();

    let show_hidden = config.show_hidden;
    let home_entries = read_dir(home_path.clone(), show_hidden)?;

    let user_dirs = get_user_dirs()?;
    let wsl_distros = get_wsl_distros();
    let drives = get_drives();

    Ok(InitData {
        config,
        home_path,
        home_entries,
        user_dirs,
        wsl_distros,
        drives,
    })
}
