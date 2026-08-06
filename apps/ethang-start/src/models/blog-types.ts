export type BlogBodyBlock = {
  _key: string;
  _type: string;
};

export type BlogCategory = {
  title: string;
};

export type BlogPost = {
  _id: string;
  _updatedAt: string;
  blogCategory?: BlogCategory | null;
  slug: { current: string };
  title: string;
};

export type BlogPostDetail = {
  _id: string;
  _updatedAt: string;
  body: BlogBodyBlock[];
  slug: { current: string };
  title: string;
};

export type PaginatedBlogResult = {
  maxPages: number;
  posts: BlogPost[];
  total: number;
};
