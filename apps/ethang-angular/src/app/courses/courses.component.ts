import { ChangeDetectionStrategy, Component, signal } from "@angular/core";

import { MainLayoutComponent } from "../layouts/main-layout/main-layout.component";
import { CourseListComponent } from "./course-list/course-list.component";
import { academindCourseData } from "./data/academind-courses";
import { bonusCourseData } from "./data/bonus-courses";
import { coltSteeleCourseData } from "./data/colt-steele-courses";
import { frontendMastersCourseData } from "./data/frontend-masters-courses";
import { readingCourseData } from "./data/reading-courses";
import { zeroToMasteryCourseData } from "./data/zero-to-mastery-courses";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainLayoutComponent, CourseListComponent],
  selector: "app-courses",
  templateUrl: "./courses.component.html",
})
export class CoursesComponent {
  public academindCourses = academindCourseData;

  public bonusCourses = bonusCourseData;

  public coltSteeleCourses = coltSteeleCourseData;

  public frontendMastersCourses = frontendMastersCourseData;

  public readingCourses = readingCourseData;

  public readonly selectedIndex = signal<null | number>(null);

  public zeroToMasteryCourses = zeroToMasteryCourseData;

  public selectAccordion(index: number) {
    this.selectedIndex.set(index);
  }
}
