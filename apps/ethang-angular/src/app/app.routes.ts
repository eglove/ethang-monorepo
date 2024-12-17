import type { Routes } from "@angular/router";

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
    loadComponent: async () => {
      return import("./blogs/forcing-react/forcing-react.component").then((module) => {
        return module.ForcingReactComponent;
      });
    },
    path: "blog/forcing-react",
  },
  {
    loadComponent: async () => {
      return import("./blogs/angular-now/angular-now.component").then((module) => {
        return module.AngularNowComponent;
      });
    },
    path: "blog/angular-now",
  },
];
