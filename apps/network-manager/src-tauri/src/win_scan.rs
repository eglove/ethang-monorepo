use windows::{
    Win32::NetworkManagement::WiFi::{
        WlanOpenHandle, WlanCloseHandle, WlanEnumInterfaces, WlanScan,
        WLAN_INTERFACE_INFO_LIST,
    },
    Win32::Foundation::{WIN32_ERROR, HANDLE},
};
use std::ffi::c_void;

pub fn force_wifi_scan() -> Result<(), String> {
    unsafe {
        let mut handle = HANDLE::default();
        let mut negotiated_version = 0;

        // Open handle to WLAN interface
        let result = WlanOpenHandle(2, None, &mut negotiated_version, &mut handle);
        if result != 0 {
            return Err(format!("Failed to open WLAN handle: {}", WIN32_ERROR(result).to_hresult()));
        }

        // Ensure handle is closed when we're done
        let _guard = scopeguard::guard(handle, |handle| {
            WlanCloseHandle(handle, None);
        });

        // Get the list of WLAN interfaces
        let mut interface_list: *mut WLAN_INTERFACE_INFO_LIST = std::ptr::null_mut();
        let result = WlanEnumInterfaces(handle, None, &mut interface_list);
        if result != 0 {
            return Err(format!("Failed to enumerate WLAN interfaces: {}", WIN32_ERROR(result).to_hresult()));
        }

        // Ensure interface list is freed when we're done
        let _interface_guard = scopeguard::guard(interface_list, |list| {
            // Convert the pointer to usize first, then to *mut c_void, then to HLOCAL, and wrap in Some
            let ptr_as_usize = list as usize;
            let ptr_as_c_void = ptr_as_usize as *mut c_void;
            let hlocal = windows::Win32::Foundation::HLOCAL(ptr_as_c_void);
            windows::Win32::Foundation::LocalFree(Some(hlocal));
        });

        let interfaces = &*interface_list;
        if interfaces.dwNumberOfItems == 0 {
            return Err("No WLAN interfaces found".to_string());
        }

        // Initiate scan on the first interface
        let interface_info = &interfaces.InterfaceInfo[0];
        let result = WlanScan(
            handle,
            &interface_info.InterfaceGuid,
            None,
            None,
            None,
        );

        if result != 0 {
            return Err(format!("Failed to initiate scan: {}", WIN32_ERROR(result).to_hresult()));
        }

        Ok(())
    }
}
