import { invoke } from "@tauri-apps/api/core";
import isError from "lodash/isError.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import { useEffect, useRef, useState } from "react";

type WiFiNetworkInfo = {
  authentication: string;
  channel: number;
  encryption: string;
  is_connected: boolean;
  mac_address: string;
  signal_strength: number;
  ssid: string;
};

export const App = () => {
  const [networks, setNetworks] = useState<WiFiNetworkInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchNetworks = async () => {
      try {
        if (isInitialLoad.current) {
          setLoading(true);
        }

        const networkList = await invoke<WiFiNetworkInfo[]>("list_networks");
        setNetworks(networkList);
        setError(null);

        if (isInitialLoad.current) {
          isInitialLoad.current = false;
        }
      } catch (_error) {
        setError(isError(_error) ? _error.message : String(_error));
      } finally {
        setLoading(false);
      }
    };

    fetchNetworks().catch(globalThis.console.error);

    const intervalId = setInterval(() => {
      fetchNetworks().catch(globalThis.console.error);
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">WiFi Networks</h1>
        <p className="text-gray-600">
          List of all available WiFi networks in range
        </p>
      </header>

      {loading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!isNil(error) && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {!loading && isNil(error) && 0 === networks.length && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>No WiFi networks found. Make sure your WiFi is turned on.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {map(networks, (network, index) => (
          <div
            className={`bg-white rounded-lg shadow-md overflow-hidden ${
              network.is_connected ? "border-2 border-green-500" : ""
            }`}
            key={index}
          >
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800 truncate">
                  {network.ssid}
                </h2>
                <div className="flex space-x-2">
                  {network.is_connected ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Connected
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                      Available
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Signal Strength
                </h3>
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      style={{
                        width: `${Math.max(0, Math.min(100, (network.signal_strength + 100) * 2))}%`,
                      }}
                      className="bg-blue-600 h-2.5 rounded-full"
                    ></div>
                  </div>
                  <span className="ml-2 text-gray-700">
                    {network.signal_strength} dBm
                  </span>
                </div>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Security
                </h3>
                <p className="text-gray-700">
                  {network.authentication} / {network.encryption}
                </p>
              </div>
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Channel
                </h3>
                <p className="text-gray-700">{network.channel}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  MAC Address
                </h3>
                <p className="text-gray-700 truncate">{network.mac_address}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
