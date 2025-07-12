import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Progress,
} from "@heroui/react";
import { useMutation } from "@tanstack/react-query";
import { twMerge } from "tailwind-merge";

import type { WiFiNetworkInfo } from "../queries/list-networks.ts";

import { connectToNetwork } from "../queries/connect-to-network.ts";
import { toggleFavorite } from "../queries/toggle-favorite.ts";

type WifiNetworkCardProperties = {
  network: WiFiNetworkInfo;
};

export const WifiNetworkCard = ({ network }: WifiNetworkCardProperties) => {
  const networkStrength = Math.max(
    0,
    Math.min(100, (network.signal_strength + 100) * 2),
  );

  const { isPending, mutate } = useMutation(connectToNetwork);
  const { isPending: isFavoritePending, mutate: mutateFavorite } =
    useMutation(toggleFavorite);

  return (
    <Card
      className={twMerge(network.is_connected && "border-2 border-success")}
    >
      <CardHeader>
        <div className="flex justify-between gap-4 w-full">
          <h2 className="font-semibold text-wrap">{network.ssid}</h2>
          <Chip
            color={network.is_connected ? "success" : "default"}
            variant="bordered"
          >
            {network.is_connected ? "Connected" : "Available"}
          </Chip>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid gap-4">
          <Progress
            color="primary"
            label="Signal Strength"
            showValueLabel={true}
            value={networkStrength}
          />
          <div>
            <h3 className="text-gray-500 mb-1">Security</h3>
            <p className="text-gray-700">
              {network.authentication} / {network.encryption}
            </p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-1">Channel</h3>
            <p className="text-gray-700">{network.channel}</p>
          </div>
          <div>
            <h3 className="text-gray-500 mb-1">MAC Address</h3>
            <p className="text-gray-700">{network.mac_address}</p>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <div className="flex justify-between w-full">
          {!network.is_connected && (
            <Button
              onPress={() => {
                mutate(network);
              }}
              color="primary"
              isLoading={isPending}
            >
              Connect
            </Button>
          )}

          {network.is_connected && <div></div>}

          <Button
            isIconOnly
            aria-label={
              network.is_favorite ? "Remove from favorites" : "Add to favorites"
            }
            onPress={() => {
              mutateFavorite(network);
            }}
            color="default"
            isLoading={isFavoritePending}
            variant="light"
          >
            {network.is_favorite ? (
              <StarSolidIcon className="h-5 w-5 text-warning" />
            ) : (
              <StarOutlineIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
