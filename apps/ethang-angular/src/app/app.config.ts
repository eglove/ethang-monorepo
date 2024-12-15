import { provideHttpClient, withFetch } from "@angular/common/http";
import { type ApplicationConfig, isDevMode, provideZoneChangeDetection } from "@angular/core";
import { provideClientHydration, withEventReplay } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
};
