import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
})
export class MainLayoutComponent {}
