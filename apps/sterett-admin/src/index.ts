export default {
  async fetch(request, environment) {
    const response = await environment.ASSETS.fetch(request);

    if (404 === response.status) {
      return environment.ASSETS.fetch(
        new Request(new URL("/", request.url), request),
      );
    }

    return response;
  },
} satisfies ExportedHandler<{ ASSETS: Fetcher }>;
