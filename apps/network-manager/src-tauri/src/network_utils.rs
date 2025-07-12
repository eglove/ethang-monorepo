use crate::{WiFiNetworkInfo};
use crate::favorites;
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

fn try_connect_to_favorite_networks(current_ssid: &str) -> Result<Option<String>, String> {
    if check_internet_connectivity() {
        return Ok(None);
    }

    println!("No internet connectivity on current network: {}", current_ssid);

    let favorites = match favorites::read_favorites() {
        Ok(favs) => favs,
        Err(e) => return Err(format!("Failed to read favorites: {:?}", e)),
    };

    let available_networks = match wifiscanner::scan() {
        Ok(networks) => networks,
        Err(e) => return Err(format!("Failed to scan WiFi networks: {:?}", e)),
    };

    let mut favorite_networks: Vec<_> = available_networks
        .iter()
        .filter(|network| favorites.contains(&network.ssid) && network.ssid != current_ssid)
        .collect();

    favorite_networks.sort_by(|a, b| {
        let a_strength = a.signal_level.parse::<i32>().unwrap_or(0);
        let b_strength = b.signal_level.parse::<i32>().unwrap_or(0);
        b_strength.cmp(&a_strength)
    });

    for network in favorite_networks {
        println!("Attempting to connect to favorite network: {}", network.ssid);
        match attempt_connection(&network.ssid) {
            Ok(_) => {
                println!("Successfully connected to: {}", network.ssid);
                if let Some(new_ssid) = get_connected_ssid() {
                    if new_ssid == network.ssid {
                        return Ok(Some(new_ssid));
                    }
                }
            }
            Err(e) => {
                println!("Failed to connect to {}: {}", network.ssid, e);
            }
        }
    }

    println!("Could not connect to any favorite network, staying with current connection");
    Ok(None)
}

pub fn scan_networks() -> Result<Vec<WiFiNetworkInfo>, String> {
    let connected_ssid = get_connected_ssid();

    if let Some(current_ssid) = &connected_ssid {
        match try_connect_to_favorite_networks(current_ssid) {
            Ok(Some(_)) => {
                return scan_networks();
            }
            Ok(None) => {
            }
            Err(e) => {
                return Err(e);
            }
        }
    }

    let favorites = match favorites::read_favorites() {
        Ok(favs) => favs,
        Err(e) => return Err(format!("Failed to read favorites: {:?}", e)),
    };

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

            let is_favorite = favorites.contains(&ssid);

            WiFiNetworkInfo {
                ssid,
                signal_strength,
                channel,
                authentication,
                encryption,
                mac_address,
                is_connected,
                is_favorite,
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
    result.sort_by(|a, b| {
        (
            !a.is_connected,
            !a.is_favorite,
            -a.signal_strength
        ).cmp(&(
            !b.is_connected,
            !b.is_favorite,
            -b.signal_strength
        ))
    });
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

pub fn check_internet_connectivity() -> bool {
    let output = Command::new("ping")
        .args(["-n", "1", "-w", "3000", "8.8.8.8"])
        .output();

    match output {
        Ok(output) => output.status.success(),
        Err(_) => false,
    }
}
