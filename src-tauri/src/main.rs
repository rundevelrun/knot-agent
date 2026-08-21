use std::{
    io::{BufRead, BufReader},
    process::{Command, Stdio},
    thread,
};

use serde::Serialize;
use tauri::{Emitter, Window};

#[derive(Clone, Serialize)]
struct CliStreamPayload {
    #[serde(rename = "nodeId")]
    node_id: String,
    chunk: String,
    stream: String,
}

#[tauri::command]
fn run_agent_cli(
    window: Window,
    node_id: String,
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
) -> Result<String, String> {
    let mut cmd = Command::new(&command);
    cmd.args(&args)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    if let Some(dir) = cwd.as_deref().filter(|dir| !dir.is_empty()) {
        cmd.current_dir(dir);
    }

    let mut child = cmd
        .spawn()
        .map_err(|error| format!("Failed to spawn CLI agent '{}': {}", command, error))?;

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to open stdout".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Failed to open stderr".to_string())?;

    let stdout_window = window.clone();
    let stdout_node_id = node_id.clone();
    let stdout_handle = thread::spawn(move || read_stream(stdout, stdout_window, stdout_node_id, "stdout"));

    let stderr_window = window.clone();
    let stderr_node_id = node_id.clone();
    let stderr_handle = thread::spawn(move || read_stream(stderr, stderr_window, stderr_node_id, "stderr"));

    let status = child
        .wait()
        .map_err(|error| format!("CLI agent execution error: {}", error))?;

    let mut full_output = stdout_handle
        .join()
        .map_err(|_| "Failed to join stdout reader".to_string())?;
    let stderr_output = stderr_handle
        .join()
        .map_err(|_| "Failed to join stderr reader".to_string())?;

    if !stderr_output.is_empty() {
        if !full_output.is_empty() {
            full_output.push('\n');
        }
        full_output.push_str(&stderr_output);
    }

    if !status.success() {
        return Err(format!(
            "CLI agent '{}' exited with status {}",
            command,
            status
                .code()
                .map_or_else(|| "unknown".to_string(), |code| code.to_string())
        ));
    }

    Ok(full_output)
}

fn read_stream<R: std::io::Read>(
    stream: R,
    window: Window,
    node_id: String,
    stream_name: &'static str,
) -> String {
    let reader = BufReader::new(stream);
    let mut collected = String::new();

    for line in reader.lines().map_while(Result::ok) {
        collected.push_str(&line);
        collected.push('\n');

        let _ = window.emit(
            "cli-agent-stream",
            CliStreamPayload {
                node_id: node_id.clone(),
                chunk: line,
                stream: stream_name.to_string(),
            },
        );
    }

    collected
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![run_agent_cli])
        .run(tauri::generate_context!())
        .expect("error while running KnotAgent backend");
}

fn main() {
    run();
}
