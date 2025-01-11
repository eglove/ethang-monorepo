import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { MainLayoutComponent } from "../layouts/main-layout/main-layout.component";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MainLayoutComponent, RouterLink],
  selector: "app-home",
  templateUrl: "./home.component.html",
})
export class HomeComponent {
  public blogs = [
    {
      link: "/blog/mimetic-desire",
      title: "Mimetic Desire",
    },
    {
      link: "/blog/motivation",
      title: "Notes: Generating motivation in software engineering",
    },
    {
      link: "/blog/angular-now",
      title: "It's Angular Now",
    },
    {
      link: "/blog/forcing-react",
      title: "Forcing React to be What It Isn't",
    },
  ];
}
