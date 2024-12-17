import {
  ChangeDetectionStrategy, Component, inject,
} from "@angular/core";
// eslint-disable-next-line barrel/avoid-importing-barrel-files
import { CloudinaryModule, placeholder } from "@cloudinary/ng";

import { BlogLayoutComponent } from "../../layouts/blog-layout/blog-layout.component";
import { CloudinaryService } from "../../services/cloudinary.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, CloudinaryModule],
  selector: "app-forcing-react",
  templateUrl: "./forcing-react.component.html",
})
export class ForcingReactComponent {
  private readonly cloudinaryService = inject(CloudinaryService);

  public frameworkBenchMarkImage = this.cloudinaryService.getImage("framework-comparison");

  public reactScheduleImage = this.cloudinaryService.getImage("react-team-schedule");

  protected readonly placeholder = placeholder;
}
