use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PinnedFolder {
    pub name: String,
    pub path: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub theme: String,
    pub density: String,
    pub sidebar_open: bool,
    pub show_hidden: bool,
    pub vim_navigation: bool,
    #[serde(default)]
    pub hide_titlebar: bool,
    pub last_path: Option<String>,
    #[serde(default)]
    pub pinned_folders: Vec<PinnedFolder>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "sage".to_string(),
            density: "comfortable".to_string(),
            sidebar_open: true,
            show_hidden: false,
            vim_navigation: true,
            hide_titlebar: false,
            last_path: None,
            pinned_folders: Vec::new(),
        }
    }
}

fn config_path(app_handle: &tauri::AppHandle) -> PathBuf {
    let config_dir = app_handle
        .path()
        .app_config_dir()
        .expect("failed to resolve app config dir");
    fs::create_dir_all(&config_dir).ok();
    config_dir.join("config.json")
}

#[tauri::command]
pub fn load_config(app_handle: tauri::AppHandle) -> AppConfig {
    let path = config_path(&app_handle);
    match fs::read_to_string(&path) {
        Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
        Err(_) => AppConfig::default(),
    }
}

#[tauri::command]
pub fn save_config(app_handle: tauri::AppHandle, config: AppConfig) -> Result<(), String> {
    let path = config_path(&app_handle);
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write config: {}", e))?;
    Ok(())
}
