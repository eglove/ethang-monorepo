import { faker } from "@faker-js/faker";
import { describe, expect, expectTypeOf, it } from "vitest";

import { coursePathData } from "../../stores/course-path-store.ts";
import { coursesText } from "./courses-text.ts";

const makeCourse = (overrides = {}) => ({
  _id: faker.string.uuid(),
  author: faker.person.fullName(),
  name: faker.lorem.words(2),
  url: faker.internet.url(),
  ...overrides,
});

const makeLearningPath = (courses = [makeCourse()], overrides = {}) => ({
  _id: faker.string.uuid(),
  courseCount: courses.length,
  courses,
  name: faker.company.name(),
  swebokFocus: faker.lorem.word(),
  url: faker.internet.url(),
  ...overrides,
});

describe(coursesText, () => {
  it("includes the main header", () => {
    coursePathData.learningPaths = [];

    const result = coursesText();

    expect(result).toContain("EthanG | Recommended Courses");
  });

  it("includes the curriculum overview section", () => {
    coursePathData.learningPaths = [];

    const result = coursesText();

    expect(result).toContain("Curriculum Overview");
  });

  it("renders correctly with no learning paths", () => {
    coursePathData.learningPaths = undefined;

    const result = coursesText();

    expectTypeOf(result).toBeString();

    expect(result.length).toBeGreaterThan(0);
  });

  it("includes course information in the table", () => {
    const course = makeCourse({
      author: "Jane Smith",
      name: "Advanced TypeScript",
      url: "https://ts-course.example.com",
    });
    coursePathData.learningPaths = [makeLearningPath([course])];

    const result = coursesText();

    expect(result).toContain("Jane Smith");
    expect(result).toContain("Advanced TypeScript");
  });

  it("includes a link to the course", () => {
    const course = makeCourse({ url: "https://specific-course.example.com" });
    coursePathData.learningPaths = [makeLearningPath([course])];

    const result = coursesText();

    expect(result).toContain("https://specific-course.example.com");
  });

  it("includes a section for each learning path", () => {
    const path1 = makeLearningPath([makeCourse()], { name: "Path Alpha" });
    const path2 = makeLearningPath([makeCourse()], { name: "Path Beta" });
    coursePathData.learningPaths = [path1, path2];

    const result = coursesText();

    expect(result).toContain("Path Alpha");
    expect(result).toContain("Path Beta");
  });

  it("includes semantic ID for each course", () => {
    const course = makeCourse({ author: "John Doe", name: "React Course" });
    coursePathData.learningPaths = [makeLearningPath([course])];

    const result = coursesText();

    // kebabCase(toLower('John Doe')) = 'john-doe'
    // kebabCase(toLower('React Course')) = 'react-course'
    expect(result).toContain("ethang:course:john-doe:react-course");
  });

  it("lists all courses across multiple paths in the table", () => {
    const course1 = makeCourse({ name: "Course One" });
    const course2 = makeCourse({ name: "Course Two" });
    coursePathData.learningPaths = [
      makeLearningPath([course1]),
      makeLearningPath([course2]),
    ];

    const result = coursesText();

    expect(result).toContain("Course One");
    expect(result).toContain("Course Two");
  });
});
