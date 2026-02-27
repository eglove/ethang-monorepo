import { BlogModel } from "../../../models/blog-model.ts";
import { BlogLayout } from "../../layouts/blog-layout.tsx";
import { PortableText } from "../../portable-text.tsx";
import { H1 } from "../../typography/h1.tsx";

type BlogPostProperties = {
  slug: string;
};

export const BlogPost = async ({ slug }: BlogPostProperties) => {
  const blogModel = new BlogModel();
  const blog = await blogModel.getBlogBySlug(slug);

  return (
    <BlogLayout
      title={blog.title}
      author={blog.author}
      updatedAt={blog._updatedAt}
      publishedAt={blog._createdAt}
      description={blog.description}
      imageUrl={blog.featuredImage.asset.url}
    >
      <H1>{blog.title}</H1>
      <PortableText>{blog.body}</PortableText>
    </BlogLayout>
  );
};
