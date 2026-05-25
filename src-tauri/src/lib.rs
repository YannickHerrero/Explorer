mod commands;
mod config_watcher;

use commands::config::{load_config, save_config};
use commands::fs::{copy_path, copy_to_clipboard, create_dir, create_file, get_drives, get_file_meta, get_home_dir, get_user_dirs, get_wsl_distros, move_path, open_in_editor, open_in_terminal, read_dir, read_file_head, rename_path, search_dir, trash_path};
use commands::init::get_init_data;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            config_watcher::spawn(app.handle());
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
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
            rename_path,
            create_dir,
            create_file,
            search_dir,
            read_file_head,
            open_in_editor,
            open_in_terminal,
            trash_path,
            copy_to_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
