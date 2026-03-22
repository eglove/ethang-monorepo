import type { NewsUpdateReturn } from "../sanity/get-news-and-events.ts";

import { PortableText } from "./portable-text.tsx";

type NewsUpdateProperties = {
  data: NewsUpdateReturn;
};

export const NewsUpdate = async ({ data }: NewsUpdateProperties) => {
  return (
    <div class="rounded-xl border border-white/10 bg-white/5 p-5">
      <h2 class="text-base font-semibold">{data.title}</h2>
      <div class="mt-3 border-t border-white/10 pt-3">
        <PortableText content={data.description} />
      </div>
    </div>
  );
};
