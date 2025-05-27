import isNotANumber from "lodash/isNaN";

export const getUrlFilters = (url: string) => {
  const _url = new URL(url);
  let page = Number(_url.searchParams.get("page") ?? 1);
  let limit = Number(_url.searchParams.get("limit") ?? 10);
  const search = _url.searchParams.get("search");
  const sortBy = _url.searchParams.get("sortBy");
  const sortOrder = _url.searchParams.get("sortOrder") ?? "asc";
  const filterBy = _url.searchParams.get("filterBy");
  const filterValue = _url.searchParams.get("filterValue");

  if (isNotANumber(page)) {
    page = 1;
  }

  if (isNotANumber(limit)) {
    limit = 10;
  }

  return { filterBy, filterValue, limit, page, search, sortBy, sortOrder };
};
