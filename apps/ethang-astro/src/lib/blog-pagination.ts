export const BLOG_PAGE_SIZE = 10;

export const toMaxPages = (total: number) => {
  return 0 >= total ? 1 : Math.ceil(total / BLOG_PAGE_SIZE);
};

export const toPageHref = (page: number) => {
  return 1 >= page ? "/blog" : `/blog/page/${page}`;
};
