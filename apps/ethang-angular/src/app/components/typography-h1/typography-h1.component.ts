import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { twMerge } from "tailwind-merge";

@Component({
  selector: "app-typography-h1",
  imports: [],
  templateUrl: "./typography-h1.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypographyH1Component {
  public readonly className = input<string>("");
  protected readonly twMerge = twMerge;
}
