type HeadProperties = {
  description: string;
  imageUrl: string;
  title: string;
};

export const createHead =
  ({ description, imageUrl, title }: HeadProperties) =>
  () => {
    return {
      meta: [
        { title },
        { content: description, name: "description" },
        { content: "website", property: "og:type" },
        { content: title, property: "og:title" },
        { content: description, property: "og:description" },
        { content: imageUrl, property: "og:image" },
        { content: "summary_large_image", name: "twitter:card" },
        { content: title, name: "twitter:title" },
        { content: description, name: "twitter:description" },
        { content: imageUrl, name: "twitter:image" },
      ],
    };
  };
