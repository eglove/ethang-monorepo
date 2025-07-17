import { useStore } from "@ethang/store/use-store";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Link,
  Modal,
  ModalContent,
  Spinner,
} from "@heroui/react";
import { useFetch } from "@hyper-fetch/react";
import isNil from "lodash/isNil";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { getEpisodeByNumber } from "../../clients/hyper-fetch.ts";
import { CreateAppearanceForm } from "../admin/create-appearance-form.tsx";
import { createEpisodeStore } from "../admin/create-episode-store.ts";
import { signInStore } from "../admin/sign-in-store.ts";
import { AppearanceList } from "./appearance-list.tsx";

type EpisodeCardProperties = {
  episodeNumber: number;
};

export const EpisodeCard = ({
  episodeNumber,
}: Readonly<EpisodeCardProperties>) => {
  const { data, loading } = useFetch(
    getEpisodeByNumber.setParams({ number: episodeNumber }),
  );
  const { isAppearanceModalOpen } = useStore(createEpisodeStore, (state) => {
    return {
      isAppearanceModalOpen: state.isAppearanceModalOpen,
    };
  });
  const { isSignedIn } = useStore(signInStore, (state) => {
    return {
      isSignedIn: state.isSignedIn,
    };
  });

  if (loading) {
    return (
      <Card>
        <Spinner className="my-4" />
      </Card>
    );
  }

  if (isNil(data) || !URL.canParse(data.url)) {
    return null;
  }

  const url = new URL(data.url);
  const videoId = url.searchParams.get("v");

  return (
    <Card>
      <CardHeader className="flex justify-center">
        <Link
          isExternal
          showAnchorIcon
          className="font-bold text-2xl"
          href={data.url}
          underline="always"
        >
          {data.title}
        </Link>
      </CardHeader>
      <CardBody className="grid place-items-center">
        <div className="w-3xl">
          {!isNil(videoId) && (
            <LiteYouTubeEmbed id={videoId} title={data.title} />
          )}
        </div>
      </CardBody>
      <CardFooter className="grid gap-4">
        <AppearanceList
          appearances={data.appearances}
          label="Guests"
          type="isGuest"
        />
        <AppearanceList
          appearances={data.appearances}
          label="Regulars"
          type="isRegular"
        />
        <AppearanceList
          appearances={data.appearances}
          label="Bucket Pulls"
          type="isBucketPull"
        />
        {isSignedIn && (
          <>
            <Button
              onPress={() => {
                createEpisodeStore.toggleAppearanceModal(true);
              }}
              className="max-w-sm"
            >
              Add Appearance
            </Button>
            <Modal
              onOpenChange={(value) => {
                createEpisodeStore.toggleAppearanceModal(value);
              }}
              isOpen={isAppearanceModalOpen}
            >
              <ModalContent>
                <CreateAppearanceForm episodeNumber={data.number} />
              </ModalContent>
            </Modal>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
