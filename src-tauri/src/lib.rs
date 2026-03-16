#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![open_display_window])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
fn open_display_window(app: tauri::AppHandle) -> Result<(), String> {
  use tauri::Manager;

  if let Some(existing) = app.get_webview_window("display") {
    let _ = existing.show();
    let _ = existing.set_focus();
    return Ok(());
  }

  let window = tauri::WebviewWindowBuilder::new(
    &app,
    "display",
    tauri::WebviewUrl::App("index.html?display=true".into()),
  )
  .title("Presenta Pro - Display")
  .decorations(false)
  .inner_size(1920.0, 1080.0)
  .fullscreen(true)
  .build()
  .map_err(|e| e.to_string())?;

  // Best-effort: move to a non-primary monitor if one exists.
  if let (Ok(monitors), Ok(primary)) = (app.available_monitors(), app.primary_monitor()) {
    if let Some(primary) = primary {
      if let Some(external) = monitors.into_iter().find(|m| {
        m.position() != primary.position() || m.size() != primary.size()
      }) {
        let _ = window.set_position(*external.position());
        let _ = window.set_size(*external.size());
      }
    }
  }

  Ok(())
}
