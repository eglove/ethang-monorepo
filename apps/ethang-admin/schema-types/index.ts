import { blockContentType } from "./block-content-type.ts";
import { blogCategoryType } from "./blog-category-type.ts";
import { blogType } from "./blog-type.ts";
import { courseType } from "./course-type.ts";
import { learningPathType } from "./learning-path-type.ts";
import { newsType } from "./news-type.ts";
import { projectType } from "./project-type.ts";
import { techType } from "./tech-type.ts";
import { wowTaskType } from "./wow-task-types.ts";

export const schemaTypes = [
  blogType,
  blogCategoryType,
  projectType,
  newsType,
  learningPathType,
  courseType,
  techType,
  wowTaskType,
  blockContentType,
];
