import { ChangeDetectionStrategy, Component } from "@angular/core";

import { MainLayout } from "../../components/main-layout/main-layout.js";
import { TopCardComponent } from "../../components/top-card/top-card.component.js";

@Component({
  selector: "app-home",
  imports: [MainLayout, TopCardComponent],
  templateUrl: "./home.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
