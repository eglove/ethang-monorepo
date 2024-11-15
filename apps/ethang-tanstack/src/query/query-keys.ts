export const queryKeys = {
  certifications: () => {
    return ["certifications"];
  },
  courseList: () => {
    return ["courseList"];
  },
  courseSection: () => {
    return ["courseSection"];
  },
  experience: () => {
    return ["experience"];
  },
  jobs: () => {
    return ["jobs"];
  },
  learningProfiles: () => {
    return ["learningProfiles"];
  },
  projects: () => {
    return ["projects"];
  },
  recommendedCourses: () => {
    return [...queryKeys.courseList(), "Recommended Courses"];
  },
};
