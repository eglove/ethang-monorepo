import { useQuery } from "@apollo/client";
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
  useDisclosure,
} from "@heroui/react";
import isNil from "lodash/isNil";
import LiteYouTubeEmbed from "react-lite-youtube-embed";

import { type GetEpisode, getEpisode } from "../../graphql/queries.ts";
import { AddAppearanceForm } from "../admin/add-appearance-form.tsx";
import { signInStore } from "../admin/sign-in-store.ts";
import { AppearanceList } from "./appearance-list.tsx";

type EpisodeCardProperties = {
  episodeNumber: number;
};

export const EpisodeCard = ({
  episodeNumber,
}: Readonly<EpisodeCardProperties>) => {
  const { isOpen, onClose, onOpen, onOpenChange } = useDisclosure();
  const { data, loading } = useQuery<GetEpisode>(getEpisode, {
    variables: { number: episodeNumber },
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

  if (isNil(data) || !URL.canParse(data.episode.url)) {
    return null;
  }

  const url = new URL(data.episode.url);
  const videoId = url.searchParams.get("v");

  return (
    <Card className="mx-auto w-full md:w-5/6 lg:w-1/2">
      <CardHeader className="flex justify-center">
        <Link
          isExternal
          showAnchorIcon
          className="font-bold md:text-2xl"
          href={data.episode.url}
          underline="always"
        >
          {data.episode.title}
        </Link>
      </CardHeader>
      <CardBody className="grid place-items-center">
        <div className="w-full">
          {!isNil(videoId) && (
            <LiteYouTubeEmbed id={videoId} title={data.episode.title} />
          )}
        </div>
      </CardBody>
      <CardFooter className="grid gap-4">
        <AppearanceList appearances={data.episode.guests} label="Guests" />
        <AppearanceList appearances={data.episode.regulars} label="Regulars" />
        <AppearanceList
          appearances={data.episode.goldenTicketCashIns}
          label="Golden Ticket Cash Ins"
        />
        <AppearanceList
          appearances={data.episode.bucketPulls}
          label="Bucket Pulls"
        />
        {isSignedIn && (
          <>
            <Button className="max-w-sm" onPress={onOpen}>
              Add Appearance
            </Button>
            <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
              <ModalContent>
                <AddAppearanceForm
                  episodeNumber={data.episode.number}
                  key={data.episode.number}
                  onClose={onClose}
                />
              </ModalContent>
            </Modal>
          </>
        )}
      </CardFooter>
    </Card>
  );
};
