// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

#[tauri::command]
fn trigger_native_snip(app: tauri::AppHandle) -> Result<String, String> {
    // In native mode, this command minimizes the main studio window
    // and displays a transparent full-screen overlay for OS-level snipping.
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.emit("native-snip-requested", ());
    }
    Ok("Native snip triggered".into())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![trigger_native_snip])
        .run(tauri::generate_context!())
        .expect("error while running Shot2Code Tauri application");
}
