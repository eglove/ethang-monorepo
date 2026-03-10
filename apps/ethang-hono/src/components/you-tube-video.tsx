import { twMerge } from "tailwind-merge";

type LiteYoutubeProperties = {
  classNames?: { container?: string };
  title: string;
  videoId: string;
};

export const YouTubeVideo = async (properties: LiteYoutubeProperties) => {
  return (
    <div class={twMerge("my-4 aspect-video", properties.classNames?.container)}>
      <iframe
        allowfullscreen
        frameborder="0"
        title={properties.title}
        referrerpolicy="strict-origin-when-cross-origin"
        class="aspect-video max-h-full w-full object-contain"
        src={`https://www.youtube-nocookie.com/embed/${properties.videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      ></iframe>
    </div>
  );
};
