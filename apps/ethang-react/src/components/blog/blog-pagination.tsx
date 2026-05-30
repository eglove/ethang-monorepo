import { useStore } from "@ethang/store/use-store";
import { Button, Flex } from "@radix-ui/themes";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import map from "lodash/map";
import range from "lodash/range";

import { getPaginatedBlogs } from "../../models/blog-model.ts";
import { blogStore } from "./blog-store.ts";

export const BlogPagination = () => {
  const { page } = useStore(blogStore, (state) => {
    return {
      page: state.paginationPage
    };
  });

  const { data, isPending, isPlaceholderData } = useQuery({
    ...getPaginatedBlogs(page, 10),
    placeholderData: keepPreviousData
  });

  const maxPages = data?.maxPages ?? 1;
  const isLoading = isPending || isPlaceholderData;

  return (
    <Flex gap="2" justify="center">
      <Button
        variant="soft"
        disabled={isLoading || 1 === page}
        onClick={() => {
          blogStore.decrementPage();
        }}
      >
        ‹
      </Button>
      {map(range(1, maxPages + 1), (p) => {
        return (
          <Button
            key={p}
            disabled={isLoading}
            variant={p === page ? "solid" : "soft"}
            onClick={() => {
              blogStore.setPage(p);
            }}
          >
            {p}
          </Button>
        );
      })}
      <Button
        variant="soft"
        disabled={isLoading || page === maxPages}
        onClick={() => {
          blogStore.incrementPage();
        }}
      >
        ›
      </Button>
    </Flex>
  );
};
