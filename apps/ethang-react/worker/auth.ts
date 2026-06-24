const getSessionToken = async (
  request: Request,
  environment: Env
): Promise<string> => {
  const clientToken = request.headers.get("X-Token");

  if (null !== clientToken && "" !== clientToken) {
    return clientToken;
  }

  const signInOptions = {
    body: JSON.stringify({
      email: environment.ADMIN_USER,
      password: environment.ADMIN_PASS
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST"
  };

  let verified = await fetch("https://auth.ethang.dev/verify", signInOptions);

  if (!verified.ok) {
    verified = await fetch("https://auth.ethang.dev/sign-in", signInOptions);
  }

  if (!verified.ok) {
    throw new Error("Unauthorized");
  }

  const verifiedData: { sessionToken: string } = await verified.json();
  return verifiedData.sessionToken;
};

export { getSessionToken };
