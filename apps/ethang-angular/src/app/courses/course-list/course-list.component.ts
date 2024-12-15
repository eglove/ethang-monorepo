import { Component, input, signal } from "@angular/core";

import { coltSteeleCourseData } from "../data/colt-steele-courses";

@Component({
  imports: [],
  selector: "app-course-list",
  templateUrl: "./course-list.component.html",
})
export class CourseListComponent {
  public readonly courses = input.required<{
    name: string;
    url: string;
  }[]>();

  public readonly index = input.required<number>();

  public readonly selectedIndex = signal<null | number>(null);

  public readonly title = input.required<string>();

  protected readonly coltSteeleCourses = coltSteeleCourseData;

  public selectIndex(index: number) {
    this.selectedIndex.set(index);
  }
}
