import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { CloudinaryModule } from "@cloudinary/ng";

import { BlogLayoutComponent } from "../../layouts/blog-layout/blog-layout.component";
import { CloudinaryService } from "../../services/cloudinary.service";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BlogLayoutComponent, CloudinaryModule],
  selector: "app-angular-now",
  templateUrl: "./angular-now.component.html",
})
export class AngularNowComponent {
  private readonly cloudinaryService = inject(CloudinaryService);

  public crazyPillsImage = this.cloudinaryService.getImage("crazy-pills");
}
