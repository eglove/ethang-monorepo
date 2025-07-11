import { useQuery } from "@tanstack/react-query";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

import { WifiNetworkCard } from "./components/wifi-network-card.tsx";
import { listNetworks } from "./queries/list-networks.ts";

export const App = () => {
  const { data: networks, error, isPending } = useQuery(listNetworks);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">WiFi Networks</h1>
        <p className="text-gray-600">
          List of all available WiFi networks in range
        </p>
      </header>

      {isPending && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isNil(error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {error.message}
          </p>
        </div>
      )}

      {!isPending && isNil(error) && 0 === networks?.length && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>No WiFi networks found. Make sure your WiFi is turned on.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {map(networks, (network) => {
          return <WifiNetworkCard network={network} />;
        })}
      </div>
    </div>
  );
};
