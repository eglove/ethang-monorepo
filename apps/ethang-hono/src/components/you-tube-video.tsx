type LiteYoutubeProperties = {
  title: string;
  videoId: string;
};

export const YouTubeVideo = async (properties: LiteYoutubeProperties) => {
  return (
    <div class="my-4">
      <iframe
        allowfullscreen
        frameborder="0"
        title={properties.title}
        class="aspect-video w-full"
        referrerpolicy="strict-origin-when-cross-origin"
        src={`https://www.youtube-nocookie.com/embed/${properties.videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      ></iframe>
    </div>
  );
};
