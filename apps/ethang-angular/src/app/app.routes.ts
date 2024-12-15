import type { Routes } from "@angular/router";

import { ForcingReactComponent } from "./blogs/forcing-react/forcing-react.component";
import { CoursesComponent } from "./courses/courses.component";
import { HomeComponent } from "./home/home.component";

export const routes: Routes = [
  {
    component: HomeComponent,
    path: "",
    pathMatch: "full",
  },
  {
    component: CoursesComponent,
    path: "courses",
  },
  {
    component: ForcingReactComponent,
    path: "blog/forcing-react",
  },
];
