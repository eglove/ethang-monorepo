import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { twMerge } from "tailwind-merge";

@Component({
  selector: "app-typography-p",
  imports: [],
  templateUrl: "./typography-p.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TypographyPComponent {
  public readonly className = input<string>("");
  protected readonly twMerge = twMerge;
}
