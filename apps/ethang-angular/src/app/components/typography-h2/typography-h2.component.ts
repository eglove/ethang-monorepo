import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { twMerge } from "tailwind-merge";

@Component({
  selector: "app-typography-h2",
  imports: [],
  templateUrl: "./typography-h2.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypographyH2Component {
  public readonly className = input<string>("");
  protected readonly twMerge = twMerge;
}
