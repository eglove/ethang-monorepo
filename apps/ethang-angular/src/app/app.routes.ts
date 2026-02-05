import type { Routes } from "@angular/router";

import { CoursesComponent } from "./routes/courses.component.js";

export const routes: Routes = [
  { component: CoursesComponent, path: "courses" },
];
