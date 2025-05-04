import startsWith from "lodash/startsWith.js";

export default {
  fetch(request) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/api")) {
      return Response.json({
        name: "Cloudflare",
      });
    }
    return new Response(null, { status: 404 });
  },
  // eslint-disable-next-line sonar/no-reference-error
} satisfies ExportedHandler<Env>;
