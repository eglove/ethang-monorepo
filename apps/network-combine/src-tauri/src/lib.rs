use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;
use wifiscanner;

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

fn get_connected_ssid() -> Option<String> {
    let output = Command::new("netsh")
        .args(["wlan", "show", "interfaces"])
        .output();

    match output {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);

            for line in stdout.lines() {
                let line = line.trim();
                if line.starts_with("SSID") && !line.contains("BSSID") {
                    let parts: Vec<&str> = line.split(':').collect();
                    if parts.len() >= 2 {
                        let ssid = parts[1].trim().to_string();
                        if !ssid.is_empty() {
                            return Some(ssid);
                        }
                    }
                }
            }
            None
        },
        Err(_) => None,
    }
}

#[tauri::command]
fn list_networks() -> Result<Vec<WiFiNetworkInfo>, String> {
    let connected_ssid = get_connected_ssid();

    let networks = match wifiscanner::scan() {
        Ok(networks) => networks,
        Err(e) => return Err(format!("Failed to scan WiFi networks: {:?}", e)),
    };

    let wifi_networks: Vec<WiFiNetworkInfo> = networks
        .into_iter()
        .map(|network| {
            let ssid = network.ssid;
            let (authentication, encryption) = parse_security(&network.security);
            let mac_address = network.mac.clone();
            let signal_strength = network.signal_level.parse::<i32>().unwrap_or(0);
            let channel = network.channel.parse::<i32>().unwrap_or(0);

            let is_connected = match &connected_ssid {
                Some(connected) => *connected == ssid,
                None => false,
            };

            WiFiNetworkInfo {
                ssid,
                signal_strength,
                channel,
                authentication,
                encryption,
                mac_address,
                is_connected,
            }
        })
        .collect();

    let mut ssid_map: HashMap<String, WiFiNetworkInfo> = HashMap::new();

    for network in wifi_networks {
        let entry = ssid_map.entry(network.ssid.clone()).or_insert(network.clone());

        if network.is_connected {
            *entry = network;
        }
        else if network.channel > entry.channel {
            *entry = network;
        }
    }

    let mut wifi_networks: Vec<WiFiNetworkInfo> = ssid_map.into_values().collect();

    wifi_networks.sort_by(|a, b| b.signal_strength.cmp(&a.signal_strength));

    Ok(wifi_networks)
}

fn parse_security(security: &String) -> (String, String) {
    if security.contains("WPA2") {
        if security.contains("PSK") {
            return ("WPA2-PSK".to_string(), "AES".to_string());
        } else {
            return ("WPA2".to_string(), "AES".to_string());
        }
    } else if security.contains("WPA") {
        if security.contains("PSK") {
            return ("WPA-PSK".to_string(), "TKIP".to_string());
        } else {
            return ("WPA".to_string(), "TKIP".to_string());
        }
    } else if security.contains("WEP") {
        return ("WEP".to_string(), "WEP".to_string());
    } else if security.contains("Open") || security.is_empty() {
        return ("Open".to_string(), "None".to_string());
    }

    ("Unknown".to_string(), "Unknown".to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_networks])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
