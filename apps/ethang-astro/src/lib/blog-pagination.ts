export const BLOG_PAGE_SIZE = 10;

export const toMaxPages = (total: number) => {
  if (0 >= total) {
    return 1;
  }

  return Math.ceil(total / BLOG_PAGE_SIZE);
};

export const toPageHref = (page: number) => {
  if (1 >= page) {
    return "/blog";
  }

  return `/blog/page/${page}`;
};
