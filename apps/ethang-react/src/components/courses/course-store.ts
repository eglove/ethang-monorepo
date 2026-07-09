import { makeStore, type Store } from "@ethang/store/store.ts";

export type CourseState = {
  courseIndex: number;
  coursesIndexes: Map<string, number>;
};

const initialState: CourseState = {
  courseIndex: 0,
  coursesIndexes: new Map<string, number>()
};

const addCourseOrder = (store: Store<CourseState>, id: string) => {
  return store.update((draft) => {
    draft.coursesIndexes.set(id, draft.courseIndex + 1);
    draft.courseIndex += 1;
  });
};

export const courseStore: Store<CourseState> = makeStore(initialState);

export const courseStoreActions = {
  addCourseOrder: (id: string) => {
    return addCourseOrder(courseStore, id);
  }
};
