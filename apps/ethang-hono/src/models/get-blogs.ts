export type Base = {
  id: string;
  rev: string;
};

export type Blog = {
  _createdAt: string;
  _updatedAt: string;
  author: string;
  blogCategory: BlogCategory;
  description: string;
  slug: Slug;
  title: string;
};

export type BlogCategory = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _system?: System;
  _type: string;
  _updatedAt: string;
  title: string;
};

export type GetBlogs = Blog[];

export type Slug = {
  _type: string;
  current: string;
};

export type System = {
  base: Base;
};
