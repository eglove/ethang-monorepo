import type { SortDescriptor } from "@nextui-org/react";

import { useSuspenseQuery } from "@tanstack/react-query";
import filterer from "lodash/filter";
import includes from "lodash/includes";
import isEmpty from "lodash/isEmpty";
import isNil from "lodash/isNil";
import orderBy from "lodash/orderBy";
import toLower from "lodash/toLower";
import { useMemo, useState } from "react";

import { filesRouteQueries } from "../../routes/files.tsx";

export const useFileTable = (query: keyof typeof filesRouteQueries) => {
  const { data } = useSuspenseQuery(filesRouteQueries[query]);
  const [filter, setFilter] = useState("");
  const [sortConfig, setSortConfig] = useState<SortDescriptor>({
    column: "date",
    direction: "descending",
  });

  const sortedData = useMemo(() => {
    let sortedItems = [...data];

    if (!isNil(sortConfig) && !isNil(sortConfig.direction)) {
      sortedItems = orderBy(
        sortedItems,
        [sortConfig.column],
        ["ascending" === sortConfig.direction
          ? "asc"
          : "desc"],
      ) as typeof data;
    }

    if (!isEmpty(filter)) {
      sortedItems = filterer(sortedItems, (item) => {
        return (
          includes(toLower(item.title), toLower(filter)) ||
          includes(
            toLower(
              new Date(item.date).toLocaleString(undefined, {
                dateStyle: "long",
              }),
            ),
            toLower(filter),
          )
        );
      });
    }

    return sortedItems;
  }, [data, sortConfig, filter]);

  return {
    filter,
    setFilter,
    setSortConfig,
    sortConfig,
    sortedData,
  };
};
