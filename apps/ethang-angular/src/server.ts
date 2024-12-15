import { AngularAppEngine, createRequestHandler } from "@angular/ssr";

const angularApp = new AngularAppEngine();

/**
 * This is a request handler used by the Angular CLI (dev-server and during build).
 */
export const requestHandler = createRequestHandler(async (request) => {
  const response = await angularApp.handle(request);

  return response ?? new Response("Page not found.", { status: 404 });
});

export default { fetch: requestHandler };
