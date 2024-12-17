import {
  ChangeDetectionStrategy,
  Component,
} from "@angular/core";

import { MainLayoutComponent } from "../main-layout/main-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainLayoutComponent],
  selector: "app-blog-layout",
  templateUrl: "./blog-layout.component.html",
})
export class BlogLayoutComponent {

}
