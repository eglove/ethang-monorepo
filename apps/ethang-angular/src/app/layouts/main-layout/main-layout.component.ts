import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { UAParser } from "ua-parser-js";

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  selector: "app-main-layout",
  templateUrl: "./main-layout.component.html",
})

export class MainLayoutComponent {
  public async handleResumeClick() {
    // eslint-disable-next-line compat/compat,n/no-unsupported-features/node-builtins
    const parser = UAParser(globalThis.navigator.userAgent);

    const data = JSON.stringify({
      browser: parser.browser.name,
      device: parser.device.type,
      eventName: "website-resume",
      referrer: globalThis.document.referrer,
      url: globalThis.location.href,
    });
    const base64Data = globalThis.btoa(data);
    globalThis.console.log(base64Data);

    const url = new URL("https://track.ethang.dev/track");
    url.searchParams.set("data", base64Data);
    await globalThis.fetch(url);
  }
}
