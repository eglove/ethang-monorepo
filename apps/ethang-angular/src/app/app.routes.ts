import type { Routes } from "@angular/router";

import { CoursesComponent } from "./courses/courses.component";
import { HomeComponent } from "./home/home.component";

export const routes: Routes = [
  {
    component: HomeComponent,
    path: "",
    pathMatch: "full",
    title: "EthanG",
  },
  {
    component: CoursesComponent,
    path: "courses",
    title: "EthanG | Courses",
  },
  {
    loadComponent: async () => {
      return import("./pages/routine/routine.component").then((module) => {
        return module.RoutineComponent;
      });
    },
    path: "routine",
    title: "EthanG | Local Routine Todo",
  },
  {
    loadComponent: async () => {
      return import("./blogs/forcing-react/forcing-react.component").then((module) => {
        return module.ForcingReactComponent;
      });
    },
    path: "blog/forcing-react",
    title: "EthanG | Forcing React to be What It Isn't",
  },
  {
    loadComponent: async () => {
      return import("./blogs/angular-now/angular-now.component").then((module) => {
        return module.AngularNowComponent;
      });
    },
    path: "blog/angular-now",
    title: "EthanG | It's Angular Now",
  },
  {
    loadComponent: async () => {
      return import("./blogs/motivation/motivation.component").then((module) => {
        return module.MotivationComponent;
      });
    },
    path: "blog/motivation",
    title: "EthanG | Notes on generating motivation in software engineering.",
  },
  {
    loadComponent: async () => {
      return import("./blogs/learning-log-sagemaker-1/learning-log-sagemaker-1.component").then((module) => {
        return module.LearningLogSagemaker1Component;
      });
    },
    path: "blog/learning-log-sagemaker-1",
    title: "EthanG | Study Log: AWS Sagemaker Setup",
  },
  {
    loadComponent: async () => {
      return import("./blogs/mimetic-desire/mimetic-desire.component").then((module) => {
        return module.MimeticDesireComponent;
      });
    },
    path: "blog/mimetic-desire",
    title: "EthanG | Mimetic Desire",
  },
];
