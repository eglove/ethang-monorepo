export default {
  async fetch(request, environment) {
    const response = await environment.ASSETS.fetch(request);

    return 404 === response.status
      ? environment.ASSETS.fetch(
          new Request(new URL("/", request.url), request)
        )
      : response;
  }
} satisfies ExportedHandler<{ ASSETS: Fetcher }>;
