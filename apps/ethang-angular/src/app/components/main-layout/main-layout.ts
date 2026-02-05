import { Component } from "@angular/core";

import { NavigationComponent } from "../navigation/navigation.component.js";

@Component({
  selector: "app-main-layout",
  imports: [NavigationComponent],
  templateUrl: "./main-layout.html",
})
export class MainLayout {}
