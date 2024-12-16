import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
} from "@angular/core";
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
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  private readonly hyphenate = createHyphenator(enUsPatterns);

  public ngAfterViewInit() {
    const elements = [...globalThis.document.querySelectorAll("p")];
    justifyContent(elements, this.hyphenate);
  }
}
