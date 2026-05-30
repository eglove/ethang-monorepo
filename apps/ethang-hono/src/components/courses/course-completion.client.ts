import get from "lodash/get.js";
import isNil from "lodash/isNil.js";

import { AuthService } from "../../stores/auth-service.client.ts";
import { CourseCompletionStore } from "./course-completion-store.client.js";
import { CourseCompletionUI } from "./course-completion-ui.client.js";
import { CourseTrackingService } from "./course-tracking-service.client.js";

export const store = new CourseCompletionStore();
export const service = new CourseTrackingService();
export const ui = new CourseCompletionUI(store, service);
const auth = new AuthService();

export const init = async () => {
  ui.init();
  const userId = await auth.verifyToken();

  if (isNil(userId)) {
    store.setAuthenticated(null);
    return;
  }

  store.setAuthenticated(userId);
  const statuses = await service.fetchStoredStatuses(userId);

  if (statuses) {
    store.setStatuses(statuses);
  }
};

/* v8 ignore next 13 */
if (
  "undefined" !== typeof document &&
  true !== get(globalThis, ["SKIP_INIT"])
) {
  if ("loading" === document.readyState) {
    document.addEventListener("DOMContentLoaded", () => {
      init().catch(globalThis.console.error);
    });
  } else {
    await init();
  }
}
