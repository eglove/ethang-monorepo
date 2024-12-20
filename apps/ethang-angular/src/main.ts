import { bootstrapApplication } from "@angular/platform-browser";

import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";

bootstrapApplication(AppComponent, appConfig)
  // eslint-disable-next-line unicorn/prefer-top-level-await
  .catch((error: unknown) => {
    globalThis.console.error(error);
  });
