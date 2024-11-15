import blockContent from "./block-content";
import { blog } from "./blog";
import { certification } from "./certification";
import { course } from "./course";
import { courseList } from "./course-list";
import { courseSection } from "./course-section";
import { imageUpload } from "./image";
import { job } from "./job";
import { learningProfile } from "./learning-profile";
import methodology from "./methodology";
import { projects } from "./projects";
import technology from "./technology";

export const schemaTypes = [
  blockContent,
  technology,
  methodology,
  job,
  certification,
  learningProfile,
  projects,
  course,
  courseSection,
  courseList,
  imageUpload,
  blog,
];
