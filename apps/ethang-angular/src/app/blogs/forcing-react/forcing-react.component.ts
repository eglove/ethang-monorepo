import {
  type AfterViewInit,
  ChangeDetectionStrategy,
  Component,
} from "@angular/core";
// @ts-expect-error no types
import enUsPatterns from "hyphenation.en-us";
import { createHyphenator, justifyContent } from "tex-linebreak";

import { BlogLayoutComponent } from "../../layouts/blog-layout/blog-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent],
  selector: "app-forcing-react",
  templateUrl: "./forcing-react.component.html",
})
export class ForcingReactComponent implements AfterViewInit {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  private readonly hyphenate = createHyphenator(enUsPatterns);

  public ngAfterViewInit() {
    const elements = [...globalThis.document.querySelectorAll("p")];
    justifyContent(elements, this.hyphenate);
  }
}