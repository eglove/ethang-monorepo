export type Course = {
  _id: string;
  author: string;
  name: string;
  url: string;
};

export type GetCourses = {
  latestUpdate: {
    _id: string;
    _updatedAt: string;
  };
  learningPaths: LearningPath[];
};

export type LearningPath = {
  _id: string;
  courseCount: number;
  courses: Course[];
  name: string;
  swebokFocus: string;
  url?: string;
};
