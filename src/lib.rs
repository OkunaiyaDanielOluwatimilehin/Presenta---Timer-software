#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      open_display_window,
      close_display_window,
      list_outputs,
    ])
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
fn open_display_window(app: tauri::AppHandle, output_index: Option<usize>) -> Result<(), String> {
  use tauri::Manager;

  if let Some(existing) = app.get_webview_window("display") {
    if let Some(output_index) = output_index {
      let _ = move_window_to_output(&app, &existing, output_index);
    }
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

  if let Some(output_index) = output_index {
    let _ = move_window_to_output(&app, &window, output_index);
  } else {
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
  }

  Ok(())
}

#[tauri::command]
fn close_display_window(app: tauri::AppHandle) -> Result<(), String> {
  use tauri::Manager;
  if let Some(existing) = app.get_webview_window("display") {
    existing.close().map_err(|e| e.to_string())?;
  }
  Ok(())
}

#[derive(serde::Serialize)]
struct OutputInfo {
  index: usize,
  name: String,
  width: u32,
  height: u32,
  x: i32,
  y: i32,
  scale_factor: f64,
  is_primary: bool,
}

#[tauri::command]
fn list_outputs(app: tauri::AppHandle) -> Result<Vec<OutputInfo>, String> {
  let monitors = app.available_monitors().map_err(|e| e.to_string())?;
  let primary = app.primary_monitor().map_err(|e| e.to_string())?;

  let primary_key = primary.as_ref().map(|p| (p.position(), p.size()));

  let out = monitors
    .into_iter()
    .enumerate()
    .map(|(index, m)| {
      let name = m.name().unwrap_or_else(|| format!("Display {}", index + 1));
      let size = m.size();
      let pos = m.position();
      let is_primary = primary_key
        .map(|(ppos, psize)| ppos == m.position() && psize == m.size())
        .unwrap_or(false);

      OutputInfo {
        index,
        name,
        width: size.width,
        height: size.height,
        x: pos.x,
        y: pos.y,
        scale_factor: m.scale_factor(),
        is_primary,
      }
    })
    .collect();

  Ok(out)
}

fn move_window_to_output(
  app: &tauri::AppHandle,
  window: &tauri::WebviewWindow,
  output_index: usize,
) -> Result<(), String> {
  let monitors = app.available_monitors().map_err(|e| e.to_string())?;
  let Some(monitor) = monitors.into_iter().nth(output_index) else {
    return Err(format!("Output index {} not found", output_index));
  };
  let _ = window.set_position(*monitor.position());
  let _ = window.set_size(*monitor.size());
  Ok(())
}
