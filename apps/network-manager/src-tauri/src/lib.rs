mod network_utils;
mod win_scan;
mod favorites;

use serde::Serialize;
use std::result::Result;
use crate::network_utils::{attempt_connection, scan_networks, get_connected_ssid};

#[derive(Serialize, Clone)]
pub struct WiFiNetworkInfo {
    pub ssid: String,
    pub signal_strength: i32,
    pub channel: i32,
    pub authentication: String,
    pub encryption: String,
    pub mac_address: String,
    pub is_connected: bool,
    pub is_favorite: bool,
}

#[tauri::command]
fn list_networks() -> Result<Vec<WiFiNetworkInfo>, String> {
    if cfg!(target_os = "windows") {
        win_scan::force_wifi_scan()?;
    }
    scan_networks()
}

#[tauri::command]
fn connect_to_network(ssid: String, password: Option<String>) -> Result<String, String> {
    if let Some(connected_ssid) = get_connected_ssid() {
        if connected_ssid == ssid {
            return Ok("Already connected to this network".to_string());
        }
    }

    if password.is_none() {
        return attempt_connection(&ssid);
    }

    Err("Unknown error occurred".to_string())
}

#[tauri::command]
fn add_favorite_network(ssid: String) -> Result<bool, String> {
    match favorites::add_favorite(&ssid) {
        Ok(added) => Ok(added),
        Err(e) => Err(format!("Failed to add favorite: {}", e)),
    }
}

#[tauri::command]
fn remove_favorite_network(ssid: String) -> Result<bool, String> {
    match favorites::remove_favorite(&ssid) {
        Ok(removed) => Ok(removed),
        Err(e) => Err(format!("Failed to remove favorite: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            list_networks, 
            connect_to_network, 
            add_favorite_network, 
            remove_favorite_network
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
