import { queryOptions } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";

export type WiFiNetworkInfo = {
  authentication: string;
  channel: number;
  encryption: string;
  is_connected: boolean;
  mac_address: string;
  signal_strength: number;
  ssid: string;
};

export const listNetworks = queryOptions({
  queryFn: async () => {
    return invoke<WiFiNetworkInfo[]>("list_networks");
  },
  queryKey: ["list_networks"],
  refetchInterval: 5000,
});
