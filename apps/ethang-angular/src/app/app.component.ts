import { ChangeDetectionStrategy, Component, type OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent {
  public title = "ethang-angular";
}
