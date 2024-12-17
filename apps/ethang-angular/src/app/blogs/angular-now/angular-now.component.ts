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

  public constructor() {
    globalThis.document.title = "EthanG | It's Angular Now";
    const metaDescription = globalThis.document.createElement("meta");
    metaDescription.name = "description";
    metaDescription.content = "Why I'm switching from React to Angular";
    globalThis.document.head.append(metaDescription);
  }
}
