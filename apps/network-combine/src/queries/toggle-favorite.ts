import { invoke } from "@tauri-apps/api/core";

import { queryClient } from "../components/providers.tsx";
import { listNetworks, type WiFiNetworkInfo } from "./list-networks.ts";

export const toggleFavorite = {
  mutationFn: async (network: WiFiNetworkInfo) => {
    const command = network.is_favorite
      ? "remove_favorite_network"
      : "add_favorite_network";

    const result = await invoke<boolean>(command, {
      ssid: network.ssid,
    });

    await queryClient.fetchQuery(listNetworks);

    return result;
  },
};
