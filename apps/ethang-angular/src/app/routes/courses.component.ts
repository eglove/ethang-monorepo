import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from "@angular/core";
import { isNil } from "lodash";
import map from "lodash/map.js";

import { MainLayout } from "../components/main-layout/main-layout.js";
import { TypographyH1Component } from "../components/typography-h1/typography-h1.component.js";
import { TypographyH2Component } from "../components/typography-h2/typography-h2.component.js";
import { TypographyPComponent } from "../components/typography-p/typography-p.component.js";
import { ResourceBuilder } from "../services/resource-builder.service.js";
import { SanityService } from "../services/sanity.service.js";

@Component({
  selector: "app-courses",
  imports: [
    TypographyH1Component,
    TypographyH2Component,
    TypographyPComponent,
    MainLayout,
  ],
  templateUrl: "./courses.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent {
  private readonly resourceBuilder = inject(ResourceBuilder);

  private readonly sanity = inject(SanityService);

  public readonly courseCountResource =
    this.resourceBuilder.createResourceLoader("GetCourseCount", 0, async () =>
      this.sanity.getCourseCount(),
    );

  public readonly courseCount = computed(() => {
    const currentValue = this.courseCountResource.value();

    if (isNil(currentValue)) {
      return "courses";
    }

    return `${currentValue} courses`;
  });

  public readonly pathsResource = this.resourceBuilder.createResourceLoader(
    "GetPaths",
    [],
    async () => this.sanity.getPaths(),
  );

  public readonly paths = computed(() => {
    const originalPaths = this.pathsResource.value();
    if (!originalPaths) {
      return [];
    }

    let globalIndex = 1;
    return map(originalPaths, (path) => {
      const coursesWithGlobalIndex = map(path.courses, (course) => {
        const updatedCourse = {
          ...course,
          globalIndex,
        };

        globalIndex += 1;
        return updatedCourse;
      });

      return {
        ...path,
        courses: coursesWithGlobalIndex,
      };
    });
  });

  protected readonly swebokFocusMap = new Map([
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
    ["testing", "Software Testing"],
  ]);
}
