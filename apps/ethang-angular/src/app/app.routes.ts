import type { Routes } from "@angular/router";

import { CoursesComponent } from "./routes/courses.component.js";
import { HomeComponent } from "./routes/home/home.component.js";

export const routes: Routes = [
  { component: HomeComponent, path: "" },
  { component: CoursesComponent, path: "courses" },
];
