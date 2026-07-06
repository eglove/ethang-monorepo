import includes from "lodash/includes.js";
import isEmpty from "lodash/isEmpty.js";
import isString from "lodash/isString.js";
import { Newspaper } from "lucide-react";

import { YoutubeIcon } from "./youtube-icon.tsx";

type SourceIconProperties = {
  className?: string;
  iconUrl?: null | string;
  link: string;
};

export const SourceIcon = (properties: SourceIconProperties) => {
  const { className, iconUrl, link } = properties;
  if (includes(link, "youtube.com")) {
    return <YoutubeIcon className={className} />;
  }
  if (isString(iconUrl) && !isEmpty(iconUrl)) {
    return (
      <img
        alt=""
        src={iconUrl}
        className={className}
        data-testid="source-icon-image"
      />
    );
  }
  return <Newspaper aria-hidden="true" className={className} />;
};
