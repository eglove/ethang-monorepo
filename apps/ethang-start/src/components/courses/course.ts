export type CourseData = {
  author: string;
  courseId: string;
  courseIndex: number;
  learningPathId: string;
  learningPathName: null | string;
  learningPathOrder: number;
  learningPathUrl: null | string;
  name: string;
  swebokFocus: null | string;
  updatedAt: string;
  url: string;
};

export const swebokFocusMap = new Map([
  ["architecture", "Software Architecture"],
  ["certification", "Certification"],
  ["computing", "Computing Foundations"],
  ["construction", "Software Construction"],
  ["design", "Software Design"],
  ["economics", "Software Engineering Economics"],
  ["engineering-operations", "Software Engineering Operations"],
  ["engineering", "Engineering Foundations"],
  ["maintenance", "Software Maintenance"],
  ["management", "Software Engineering Management"],
  ["mathematical", "Mathematical Foundations"],
  ["models-methods", "Software Engineering Models and Methods"],
  ["process", "Software Engineering Process"],
  ["professional-practice", "Software Engineering Professional Practice"],
  ["quality", "Software Quality"],
  ["requirements", "Software Requirements"],
  ["scm", "Software Configuration Management"],
  ["security", "Software Security"],
  ["testing", "Software Testing"]
]);
