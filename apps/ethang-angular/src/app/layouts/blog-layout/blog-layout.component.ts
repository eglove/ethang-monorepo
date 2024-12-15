import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component, inject, input,
} from "@angular/core";
import { Meta } from "@angular/platform-browser";
// @ts-expect-error no types
import enUsPatterns from "hyphenation.en-us";
import { createHyphenator, justifyContent } from "tex-linebreak";

import { MainLayoutComponent } from "../main-layout/main-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainLayoutComponent],
  selector: "app-blog-layout",
  templateUrl: "./blog-layout.component.html",
})
export class BlogLayoutComponent implements AfterViewInit {
  public readonly description = input.required<string>();

  public readonly title = input.required<string>();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  private readonly hyphenate = createHyphenator(enUsPatterns);

  private readonly meta = inject(Meta);

  public constructor() {
    this.meta.addTags([
      {
        content: this.title(),
        name: "title",
      },
      {
        content: this.description(),
        name: "description",
      },
    ]);
  }

  public ngAfterViewInit() {
    const elements = [...globalThis.document.querySelectorAll("p")];
    justifyContent(elements, this.hyphenate);
  }
}
