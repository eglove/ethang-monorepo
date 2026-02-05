import { NgOptimizedImage } from "@angular/common";
import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { twMerge } from "tailwind-merge";

import { TypographyH2Component } from "../typography-h2/typography-h2.component.js";

@Component({
  selector: "app-top-card",
  imports: [TypographyH2Component, NgOptimizedImage],
  templateUrl: "./top-card.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopCardComponent {
  public readonly className = input<string>("");
  protected readonly twMerge = twMerge;

  protected createClass() {
    return twMerge(
      "rounded-xl border bg-card text-card-foreground shadow-sm",
      this.className(),
    );
  }
}
