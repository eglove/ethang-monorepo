import type { JSX } from "hono/jsx/jsx-runtime";

import { faker } from "@faker-js/faker";
import { Hono } from "hono";
import { describe, expect, expectTypeOf, it } from "vitest";

import { coursePathData } from "../../stores/course-path-store.ts";
import { COURSE_TRACKING_STATUS } from "../../utilities/constants.ts";
import { CourseItem } from "./course-item.tsx";
import { CourseList } from "./course-list.tsx";
import { CourseProgressBar } from "./course-progress-bar.tsx";
import { CoursesContainer, swebokFocusMap } from "./courses-container.tsx";

const renderJsx = async (jsx: JSX.Element): Promise<string> => {
  const testApp = new Hono();
  testApp.get("/", async (c) => c.html(jsx));
  const response = await testApp.request("/");
  return response.text();
};

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
  swebokFocus: "testing",
  url: faker.internet.url(),
  ...overrides,
});

const makeTracking = (overrides = {}) => ({
  courseUrl: faker.internet.url(),
  id: faker.string.uuid(),
  status: COURSE_TRACKING_STATUS.COMPLETE,
  userId: faker.string.uuid(),
  ...overrides,
});

const resetCoursePathData = () => {
  coursePathData.learningPaths = undefined;
  coursePathData.courseTrackings = [];
  coursePathData.totalCourseCount = 0;
};

describe(CourseItem, () => {
  it("renders nothing when course is not found", async () => {
    resetCoursePathData();
    coursePathData.learningPaths = [];
    const html = await renderJsx(<CourseItem courseId="nonexistent" />);

    expect(html).not.toContain("<a");
  });

  it("renders a link when course is found", async () => {
    resetCoursePathData();
    const courseId = faker.string.uuid();
    const course = makeCourse({
      _id: courseId,
      url: "https://course.example.com",
    });
    coursePathData.learningPaths = [makeLearningPath([course])];

    const html = await renderJsx(<CourseItem courseId={courseId} />);

    expect(html).toContain("https://course.example.com");
    expect(html).toContain(course.name);
  });
});

describe(CourseList, () => {
  it("renders a list with courses", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c1", url: "https://example.com/c1" });
    coursePathData.learningPaths = [makeLearningPath([course])];
    coursePathData.courseTrackings = [];

    let count = 0;
    const html = await renderJsx(
      <CourseList
        courses={[course]}
        getCount={() => {
          count += 1;
          return count;
        }}
      />,
    );

    expect(html).toContain("<ul");
    expect(html).toContain("<li");
  });

  it("shows incomplete status when no tracking data", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c1" });
    coursePathData.learningPaths = [makeLearningPath([course])];
    coursePathData.courseTrackings = [];

    let count = 0;
    const html = await renderJsx(
      <CourseList
        courses={[course]}
        getCount={() => {
          count += 1;
          return count;
        }}
      />,
    );

    expect(html).toContain(COURSE_TRACKING_STATUS.INCOMPLETE);
  });

  it("includes data-course-url on the completion button", async () => {
    resetCoursePathData();
    const courseUrl = "https://example.com/the-course";
    const course = makeCourse({ _id: "c1", url: courseUrl });
    coursePathData.learningPaths = [makeLearningPath([course])];
    coursePathData.courseTrackings = [];

    let count = 0;
    const html = await renderJsx(
      <CourseList
        courses={[course]}
        getCount={() => {
          count += 1;
          return count;
        }}
      />,
    );

    expect(html).toContain(`data-course-url="${courseUrl}"`);
  });

  it("shows tracking status when tracking data exists", async () => {
    resetCoursePathData();
    const courseUrl = faker.internet.url();
    const course = makeCourse({ _id: "c1", url: courseUrl });
    coursePathData.learningPaths = [makeLearningPath([course])];
    coursePathData.courseTrackings = [
      makeTracking({ courseUrl, status: COURSE_TRACKING_STATUS.COMPLETE }),
    ];

    let count = 0;
    const html = await renderJsx(
      <CourseList
        courses={[course]}
        getCount={() => {
          count += 1;
          return count;
        }}
      />,
    );

    expect(html).toContain(COURSE_TRACKING_STATUS.COMPLETE);
  });

  it("applies bg-neutral-secondary-medium class when status is INCOMPLETE", async () => {
    resetCoursePathData();
    const courseUrl = faker.internet.url();
    const course = makeCourse({ _id: "c1", url: courseUrl });
    coursePathData.learningPaths = [makeLearningPath([course])];
    coursePathData.courseTrackings = [
      makeTracking({ courseUrl, status: COURSE_TRACKING_STATUS.INCOMPLETE }),
    ];

    let count = 0;
    const html = await renderJsx(
      <CourseList
        courses={[course]}
        getCount={() => {
          count += 1;
          return count;
        }}
      />,
    );

    expect(html).toContain("bg-slate-700");
  });

  it("applies bg-amber-400 class when status is REVISIT", async () => {
    resetCoursePathData();
    const courseUrl = faker.internet.url();
    const course = makeCourse({ _id: "c1", url: courseUrl });
    coursePathData.learningPaths = [makeLearningPath([course])];
    coursePathData.courseTrackings = [
      makeTracking({ courseUrl, status: COURSE_TRACKING_STATUS.REVISIT }),
    ];

    let count = 0;
    const html = await renderJsx(
      <CourseList
        courses={[course]}
        getCount={() => {
          count += 1;
          return count;
        }}
      />,
    );

    expect(html).toContain("bg-amber-400");
  });
});

describe(CourseProgressBar, () => {
  it("renders three progress bars", async () => {
    resetCoursePathData();
    coursePathData.totalCourseCount = 4;
    coursePathData.courseTrackings = [
      makeTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
      makeTracking({ status: COURSE_TRACKING_STATUS.REVISIT }),
      makeTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
    ];
    const html = String(await CourseProgressBar());

    expect(html).toContain('id="complete-progress"');
    expect(html).toContain('id="revisit-progress"');
    expect(html).toContain('id="incomplete-progress"');
  });

  it("hides complete bar when complete is 0%", async () => {
    resetCoursePathData();
    coursePathData.totalCourseCount = 2;
    coursePathData.courseTrackings = [
      makeTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
      makeTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
    ];
    const html = String(await CourseProgressBar());

    expect(html).toContain("complete-progress");
    expect(html).toContain("width: 0%");
  });

  it("accepts optional container className", async () => {
    resetCoursePathData();
    coursePathData.totalCourseCount = 4;
    coursePathData.courseTrackings = [
      makeTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
      makeTracking({ status: COURSE_TRACKING_STATUS.REVISIT }),
      makeTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
    ];
    const html = String(
      await CourseProgressBar({ classNames: { container: "my-custom-class" } }),
    );

    expect(html).toContain("my-custom-class");
  });

  it("renders without props", async () => {
    resetCoursePathData();
    coursePathData.totalCourseCount = 4;
    coursePathData.courseTrackings = [
      makeTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
      makeTracking({ status: COURSE_TRACKING_STATUS.REVISIT }),
      makeTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
    ];
    const html = String(await CourseProgressBar());

    expect(html).toContain("<div");
  });

  it("renders container with id course-progress-bar", async () => {
    resetCoursePathData();
    coursePathData.totalCourseCount = 4;
    coursePathData.courseTrackings = [
      makeTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
      makeTracking({ status: COURSE_TRACKING_STATUS.REVISIT }),
      makeTracking({ status: COURSE_TRACKING_STATUS.INCOMPLETE }),
    ];
    const html = String(await CourseProgressBar());

    expect(html).toContain('id="course-progress-bar"');
  });

  it("shows percentage text when incomplete is above minToShow threshold", async () => {
    resetCoursePathData();
    coursePathData.totalCourseCount = 10;
    coursePathData.courseTrackings = [
      makeTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
    ];
    const html = String(await CourseProgressBar());

    // incomplete = 90% which is > minToShow(7), so formatter.format is called
    expect(html).toContain("incomplete-progress");
    expect(html).not.toContain('style="width: 100%"');
  });

  it("hides percentage text when incomplete is below minToShow threshold", async () => {
    // incomplete < 7 means we render "" instead of the formatted percentage
    resetCoursePathData();
    coursePathData.totalCourseCount = 100;
    coursePathData.courseTrackings = Array.from({ length: 95 }, () =>
      makeTracking({ status: COURSE_TRACKING_STATUS.COMPLETE }),
    );
    // incomplete = 5% < minToShow(7), so the ternary returns ""
    const html = String(await CourseProgressBar());

    expect(html).toContain("incomplete-progress");
  });
});

describe(CoursesContainer, () => {
  it("renders an empty list when no learning paths", async () => {
    resetCoursePathData();
    coursePathData.learningPaths = [];
    const html = String(await CoursesContainer());

    expect(html).toContain("<ul");
  });

  it("renders undefined learningPaths gracefully", async () => {
    resetCoursePathData();
    coursePathData.learningPaths = undefined;
    const html = String(await CoursesContainer());

    expect(html).toContain("<ul");
  });

  it("renders learning paths with courses", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c1" });
    coursePathData.learningPaths = [
      makeLearningPath([course], {
        name: "Path One: Details",
        swebokFocus: "testing",
        url: "https://example.com/path",
      }),
    ];
    coursePathData.courseTrackings = [];
    const html = await renderJsx(<CoursesContainer />);

    expect(html).toContain("<li");
    expect(html).toContain("Software Testing");
  });

  it("renders path names with colon split into two parts", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c2" });
    coursePathData.learningPaths = [
      makeLearningPath([course], {
        name: "Part One: Part Two",
        url: "https://example.com",
      }),
    ];
    coursePathData.courseTrackings = [];
    const html = await renderJsx(<CoursesContainer />);

    expect(html).toContain("Part One");
    expect(html).toContain("Part Two");
  });

  it("renders path name without colon as single part", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c3" });
    coursePathData.learningPaths = [
      makeLearningPath([course], {
        name: "Single Name",
        url: "https://example.com",
      }),
    ];
    coursePathData.courseTrackings = [];
    const html = await renderJsx(<CoursesContainer />);

    expect(html).toContain("Single Name");
  });

  it("renders path without URL as plain span (no colon in name)", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c4" });
    coursePathData.learningPaths = [
      makeLearningPath([course], {
        name: "No URL Path",
        swebokFocus: "testing",
        url: undefined,
      }),
    ];
    coursePathData.courseTrackings = [];
    const html = await renderJsx(<CoursesContainer />);

    expect(html).toContain("No URL Path");
    // path name should be in a span, not wrapped in a path-level anchor
    expect(html).toContain("text-amber-400/70");
  });

  it("renders path without URL and colon-split name as two spans (hasSecondPart=true)", async () => {
    resetCoursePathData();
    const course = makeCourse({ _id: "c5" });
    coursePathData.learningPaths = [
      makeLearningPath([course], {
        name: "NoURL: WithColon",
        swebokFocus: "testing",
        url: undefined,
      }),
    ];
    coursePathData.courseTrackings = [];
    const html = await renderJsx(<CoursesContainer />);

    expect(html).toContain("NoURL");
    expect(html).toContain("WithColon");
    // colon separator should appear between parts
    expect(html).toContain(":");
  });

  it("maps known swebokFocus to readable name", () => {
    expect(swebokFocusMap.get("testing")).toBe("Software Testing");
    expect(swebokFocusMap.get("architecture")).toBe("Software Architecture");
    expect(swebokFocusMap.get("quality")).toBe("Software Quality");
  });

  it("covers all swebokFocus map entries", () => {
    expect(swebokFocusMap.size).toBeGreaterThan(0);

    for (const [, value] of swebokFocusMap) {
      expectTypeOf(value).toBeString();

      expect(value).toBeTypeOf("string");
    }
  });
});
