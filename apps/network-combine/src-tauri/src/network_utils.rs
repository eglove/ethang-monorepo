use crate::{WiFiNetworkInfo};
use std::collections::HashMap;
use std::process::Command;
use std::thread;
use std::time::Duration;

pub fn get_connected_ssid() -> Option<String> {
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
        }
        Err(_) => None,
    }
}

pub fn parse_security(security: &String) -> (String, String) {
    if security.contains("WPA2") {
        return if security.contains("PSK") {
            ("WPA2-PSK".to_string(), "AES".to_string())
        } else {
            ("WPA2".to_string(), "AES".to_string())
        };
    } else if security.contains("WPA") {
        return if security.contains("PSK") {
            ("WPA-PSK".to_string(), "TKIP".to_string())
        } else {
            ("WPA".to_string(), "TKIP".to_string())
        };
    } else if security.contains("WEP") {
        return ("WEP".to_string(), "WEP".to_string());
    } else if security.contains("Open") || security.is_empty() {
        return ("Open".to_string(), "None".to_string());
    }

    ("Unknown".to_string(), "Unknown".to_string())
}

pub fn scan_networks() -> Result<Vec<WiFiNetworkInfo>, String> {
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

    Ok(process_network_list(wifi_networks))
}

fn process_network_list(wifi_networks: Vec<WiFiNetworkInfo>) -> Vec<WiFiNetworkInfo> {
    let mut ssid_map: HashMap<String, WiFiNetworkInfo> = HashMap::new();

    for network in wifi_networks {
        let entry = ssid_map
            .entry(network.ssid.clone())
            .or_insert(network.clone());

        if network.is_connected {
            *entry = network;
        } else if !entry.is_connected {
            if network.channel > entry.channel
                || (network.channel == entry.channel
                    && network.signal_strength > entry.signal_strength)
            {
                *entry = network;
            }
        }
    }

    let mut result: Vec<WiFiNetworkInfo> = ssid_map.into_values().collect();
    result.sort_by(|a, b| b.signal_strength.cmp(&a.signal_strength));
    result
}

pub fn attempt_connection(ssid: &str) -> Result<String, String> {
    let connect_result = Command::new("netsh")
        .args(["wlan", "connect", "name=", &ssid])
        .output();

    match connect_result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);

            if stderr.contains("not found") || stdout.contains("not found") {
                return Err("Password required".to_string());
            }

            if !output.status.success() || stdout.contains("failed") {
                return Err(format!("Failed to connect: {}", stdout));
            }

            for _ in 0..10 {
                thread::sleep(Duration::from_secs(1));

                if let Some(current_ssid) = get_connected_ssid() {
                    if current_ssid == ssid {
                        return Ok("Connected successfully".to_string());
                    }
                }
            }

            return Err("Connection timeout".to_string());
        }
        Err(e) => Err(format!("Failed to execute command: {}", e)),
    }
}
