import { ChangeDetectionStrategy, Component } from "@angular/core";

import { BlogLayoutComponent } from "../../layouts/blog-layout/blog-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent],
  selector: "app-mimetic-desire",
  styles: "",
  templateUrl: "./mimetic-desire.component.html",
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class MimeticDesireComponent {}
