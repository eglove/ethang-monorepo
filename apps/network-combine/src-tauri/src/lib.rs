mod network_utils;

use serde::Serialize;
use std::result::Result;
use crate::network_utils::{attempt_connection, scan_networks};

#[derive(Serialize, Clone)]
struct WiFiNetworkInfo {
    ssid: String,
    signal_strength: i32,
    channel: i32,
    authentication: String,
    encryption: String,
    mac_address: String,
    is_connected: bool,
}

#[tauri::command]
fn list_networks() -> Result<Vec<WiFiNetworkInfo>, String> {
    scan_networks()
}

#[tauri::command]
fn connect_to_network(ssid: String, password: Option<String>) -> Result<String, String> {
    if let Some(connected_ssid) = network_utils::get_connected_ssid() {
        if connected_ssid == ssid {
            return Ok("Already connected to this network".to_string());
        }
    }

    if password.is_none() {
        return attempt_connection(&ssid);
    }

    Err("Unknown error occurred".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_networks, connect_to_network])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
