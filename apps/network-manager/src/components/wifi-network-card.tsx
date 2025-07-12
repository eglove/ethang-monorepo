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
import { StarIcon, WifiIcon } from "lucide-react";
import { twMerge } from "tailwind-merge";

import type { WiFiNetworkInfo } from "../queries/list-networks.ts";

import { connectToNetwork } from "../queries/connect-to-network.ts";
import { toggleFavorite } from "../queries/toggle-favorite.ts";

type WifiNetworkCardProperties = {
  network: WiFiNetworkInfo;
};

export const WifiNetworkCard = ({
  network,
}: Readonly<WifiNetworkCardProperties>) => {
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
      <CardHeader className="p-2">
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
      <CardBody className="p-2">
        <div className="grid gap-2">
          <Progress
            showValueLabel
            color="primary"
            label="Signal Strength"
            value={networkStrength}
          />
        </div>
      </CardBody>
      <CardFooter className="p-2">
        <div className="flex justify-end w-full gap-4">
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
              <StarIcon className="size-5 text-warning fill-warning" />
            ) : (
              <StarIcon className="size-5" />
            )}
          </Button>

          <Button
            isIconOnly
            onPress={() => {
              mutate(network);
            }}
            aria-label={network.is_connected ? "Disconnect" : "Connect"}
            color={network.is_connected ? "primary" : "default"}
            isLoading={isPending}
            variant={network.is_connected ? "solid" : "light"}
          >
            <WifiIcon className="size-5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
