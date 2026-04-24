mod commands;

use commands::config::{load_config, save_config};
use commands::fs::{get_file_meta, get_home_dir, read_dir};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            read_dir,
            get_home_dir,
            get_file_meta,
            load_config,
            save_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
