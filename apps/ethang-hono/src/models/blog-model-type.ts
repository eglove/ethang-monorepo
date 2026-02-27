export type Asset = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  assetId: string;
  extension: string;
  metadata: Metadata;
  mimeType: string;
  originalFilename: string;
  path: string;
  sha1hash: string;
  size: number;
  uploadId: string;
  url: string;
};

export type Asset2 = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _type: string;
  _updatedAt: string;
  assetId: string;
  extension: string;
  metadata: Metadata2;
  mimeType: string;
  originalFilename: string;
  path: string;
  sha1hash: string;
  size: number;
  uploadId: string;
  url: string;
};

export type Base = {
  id: string;
  rev: string;
};

export type BlogCategory = {
  _ref: string;
  _type: string;
};

export type BlogModelType = {
  _createdAt: string;
  _id: string;
  _rev: string;
  _system: System;
  _type: string;
  _updatedAt: string;
  author: string;
  blogCategory: BlogCategory;
  body: Body[];
  description: string;
  featuredImage: FeaturedImage;
  publishedAt: string;
  slug: Slug;
  title: string;
};

export type Body = {
  _key: string;
  _type: string;
  alt?: string;
  asset?: Asset2;
  author?: string;
  caption?: string;
  children?: Children[];
  code?: string;
  language?: string;
  markDefs?: MarkDef[];
  quote?: string;
  source?: string;
  sourceUrl?: string;
  style?: string;
  title?: string;
  url?: string;
  videoId?: string;
};

export type Children = {
  _key: string;
  _type: string;
  marks: string[];
  text: string;
};

export type DarkMuted = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type DarkMuted2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type DarkVibrant = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type DarkVibrant2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type Dimensions = {
  _type: string;
  aspectRatio: number;
  height: number;
  width: number;
};

export type Dimensions2 = {
  _type: string;
  aspectRatio: number;
  height: number;
  width: number;
};

export type Dominant = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type Dominant2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type FeaturedImage = {
  alt: string;
  asset: Asset;
};

export type LightMuted = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type LightMuted2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type LightVibrant = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type LightVibrant2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

// eslint-disable-next-line unicorn/prevent-abbreviations
export type MarkDef = {
  _key: string;
  _type: string;
  href: string;
};

export type Metadata = {
  _type: string;
  blurHash: string;
  dimensions: Dimensions;
  hasAlpha: boolean;
  isOpaque: boolean;
  lqip: string;
  palette: Palette;
  thumbHash: string;
};

export type Metadata2 = {
  _type: string;
  blurHash: string;
  dimensions: Dimensions2;
  hasAlpha: boolean;
  isOpaque: boolean;
  lqip: string;
  palette: Palette2;
  thumbHash: string;
};

export type Muted = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type Muted2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type Palette = {
  _type: string;
  darkMuted: DarkMuted;
  darkVibrant: DarkVibrant;
  dominant: Dominant;
  lightMuted: LightMuted;
  lightVibrant: LightVibrant;
  muted: Muted;
  vibrant: Vibrant;
};

export type Palette2 = {
  _type: string;
  darkMuted: DarkMuted2;
  darkVibrant: DarkVibrant2;
  dominant: Dominant2;
  lightMuted: LightMuted2;
  lightVibrant: LightVibrant2;
  muted: Muted2;
  vibrant: Vibrant2;
};

export type Slug = {
  _type: string;
  current: string;
};

export type System = {
  base: Base;
};

export type Vibrant = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};

export type Vibrant2 = {
  _type: string;
  background: string;
  foreground: string;
  population: number;
  title: string;
};
