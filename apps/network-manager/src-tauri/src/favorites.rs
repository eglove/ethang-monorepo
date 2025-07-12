use std::collections::HashSet;
use std::fs::{self, File};
use std::io::{self, Read, Write};
use std::path::PathBuf;
use std::env;

fn get_favorites_file_path() -> io::Result<PathBuf> {
    let base_dir = env::current_exe()
        .map(|path| path.parent().unwrap_or_else(|| std::path::Path::new(".")).to_path_buf())
        .unwrap_or_else(|_| env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

    let favorites_dir = base_dir.join("favorites");
    if !favorites_dir.exists() {
        fs::create_dir_all(&favorites_dir)?;
    }

    Ok(favorites_dir.join("favorite_ssids.txt"))
}

pub fn read_favorites() -> io::Result<HashSet<String>> {
    let path = get_favorites_file_path()?;

    if !path.exists() {
        return Ok(HashSet::new());
    }

    let mut file = File::open(path)?;
    let mut contents = String::new();
    file.read_to_string(&mut contents)?;

    let favorites = contents
        .lines()
        .map(|line| line.trim().to_string())
        .filter(|line| !line.is_empty())
        .collect();

    Ok(favorites)
}

fn write_favorites(favorites: &HashSet<String>) -> io::Result<()> {
    let path = get_favorites_file_path()?;
    let mut file = File::create(path)?;

    for ssid in favorites {
        writeln!(file, "{}", ssid)?;
    }

    Ok(())
}

pub fn add_favorite(ssid: &str) -> io::Result<bool> {
    let mut favorites = read_favorites()?;
    let was_added = favorites.insert(ssid.to_string());

    if was_added {
        write_favorites(&favorites)?;
    }

    Ok(was_added)
}

pub fn remove_favorite(ssid: &str) -> io::Result<bool> {
    let mut favorites = read_favorites()?;
    let was_removed = favorites.remove(ssid);

    if was_removed {
        write_favorites(&favorites)?;
    }

    Ok(was_removed)
}
