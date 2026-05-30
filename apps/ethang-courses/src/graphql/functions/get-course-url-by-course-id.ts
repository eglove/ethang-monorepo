import { sanityClient } from "../../clients/sanity.ts";

export const getCourseUrlByCourseId = async (courseId: string) => {
  const course = await sanityClient.fetch<{ url: string } | null>(
    `*[_type == "course" && _id == $courseId][0]{"url": url}`,
    { courseId }
  );

  if (null === course) {
    throw new Error("Course not found");
  }

  return course.url;
};
