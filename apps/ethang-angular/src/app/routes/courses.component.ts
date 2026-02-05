import { ChangeDetectionStrategy, Component, inject } from "@angular/core";

import { ResourceBuilder } from "../services/resource-builder.service.js";
import { SanityService } from "../services/sanity.service.js";

@Component({
  selector: "app-courses",
  imports: [],
  templateUrl: "./courses.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoursesComponent {
  private readonly resourceBuilder = inject(ResourceBuilder);
  private readonly getPaths = async () => this.sanity.getPaths();

  public readonly paths = this.resourceBuilder.createResourceLoader(
    "GetPaths",
    [],
    this.getPaths,
  );

  private readonly sanity = inject(SanityService);
}
