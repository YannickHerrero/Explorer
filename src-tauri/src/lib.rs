mod commands;

use commands::config::{load_config, save_config};
use commands::fs::{copy_path, copy_to_clipboard, get_drives, get_file_meta, get_home_dir, get_user_dirs, get_wsl_distros, move_path, read_dir, trash_path};
use commands::init::get_init_data;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            read_dir,
            get_home_dir,
            get_user_dirs,
            get_wsl_distros,
            get_drives,
            get_file_meta,
            load_config,
            save_config,
            get_init_data,
            copy_path,
            move_path,
            trash_path,
            copy_to_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
