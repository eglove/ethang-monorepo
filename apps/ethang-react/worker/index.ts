import startsWith from "lodash/startsWith.js";

export default {
  async fetch(request, environment) {
    const url = new URL(request.url);

    if (startsWith(url.pathname, "/api/graphql")) {
      const verified = await fetch("https://auth.ethang.dev/verify", {
        body: JSON.stringify({
          email: environment.ADMIN_USER,
          password: environment.ADMIN_PASS
        }),
        headers: {
          "Content-Type": "application/json"
        },
        method: "POST"
      });

      if (!verified.ok) {
        return Response.json("Unauthorized", { status: 401 });
      }

      const verifiedData: { sessionToken: string } = await verified.json();

      const destinationUrl = new URL("https://graphql.ethang.dev/");
      destinationUrl.search = url.search;

      const newHeaders = new Headers(request.headers);
      newHeaders.set("Content-Type", "application/json");
      newHeaders.set("X-Token", verifiedData.sessionToken);

      return fetch(destinationUrl.toString(), {
        body: request.body,
        headers: newHeaders,
        method: request.method
      });
    }

    if (startsWith(url.pathname, "/api/")) {
      return Response.json({
        name: "Cloudflare"
      });
    }
    return new Response(null, { status: 404 });
  }
} satisfies ExportedHandler<Env>;
