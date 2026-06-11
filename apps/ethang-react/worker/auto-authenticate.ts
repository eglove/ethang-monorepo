export const autoAuthenticate = async (
  request: Request,
  url: URL,
  environment: Env
) => {
  const clientToken = request.headers.get("X-Token");
  const destinationUrl = new URL("https://graphql.ethang.dev/");
  destinationUrl.search = url.search;

  if (null !== clientToken && "" !== clientToken) {
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Content-Type", "application/json");
    newHeaders.set("X-Token", clientToken);
    return { destinationUrl, headers: newHeaders };
  }

  const requestOptions = {
    body: JSON.stringify({
      email: environment.ADMIN_USER,
      password: environment.ADMIN_PASS
    }),
    headers: {
      "Content-Type": "application/json"
    },
    method: "POST"
  };

  let verified = await fetch("https://auth.ethang.dev/verify", requestOptions);

  if (!verified.ok) {
    verified = await fetch("https://auth.ethang.dev/sign-in", requestOptions);
  }

  if (!verified.ok) {
    return new Error("Unauthorized");
  }

  const verifiedData: { sessionToken: string } = await verified.json();

  const newHeaders = new Headers(request.headers);
  newHeaders.set("Content-Type", "application/json");
  newHeaders.set("X-Token", verifiedData.sessionToken);

  return { destinationUrl, headers: newHeaders };
};
