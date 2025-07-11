import { invoke } from "@tauri-apps/api/core";

import { queryClient } from "../components/providers.tsx";
import { listNetworks, type WiFiNetworkInfo } from "./list-networks.ts";

export const connectToNetwork = {
  mutationFn: async (network: WiFiNetworkInfo) => {
    const result = await invoke<string>("connect_to_network", {
      password: null,
      ssid: network.ssid,
    });

    await queryClient.fetchQuery(listNetworks);

    return result;
  },
};
