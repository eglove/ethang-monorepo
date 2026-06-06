import { BaseStore } from "@ethang/store";

const initialState = {
  courseIndex: 0,
  coursesIndexes: new Map<string, number>()
};

class CourseStore extends BaseStore<typeof initialState> {
  public constructor() {
    super(initialState);
  }

  public addCourseOrder(id: string) {
    this.update((draft) => {
      draft.courseIndex += 1;
      draft.coursesIndexes.set(id, draft.courseIndex);
    });
  }
}

export const courseStore = new CourseStore();
