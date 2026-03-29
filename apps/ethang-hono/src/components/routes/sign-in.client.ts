const AUTH_COOKIE_NAME = "ethang-auth-token";

// CookieStore API is not supported in WebKit (Safari). Fall back to
// document.cookie when the API is unavailable.
const setAuthCookie = async (token: string): Promise<void> => {
  if ("cookieStore" in globalThis) {
    await globalThis.cookieStore.set(AUTH_COOKIE_NAME, token);
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=${token}; path=/`;
};

const form = document.querySelector<HTMLFormElement>("#sign-in-form");
const button = document.querySelector<HTMLButtonElement>("#sign-in-button");
const errorMessageElement =
  document.querySelector<HTMLParagraphElement>("#sign-in-error");

if (form && errorMessageElement && button) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    button.disabled = true;
    fetch("https://auth.ethang.dev/sign-up", {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    })
      .then(async (response) => {
        if (response.ok) {
          errorMessageElement.classList.add("hidden");
          return response.json<{ sessionToken: string }>();
        }
        throw new Error("Failed to sign in");
      })
      .then(async (_data) => {
        await setAuthCookie(_data.sessionToken);
        globalThis.location.href = "/courses";
        button.disabled = false;
      })
      .catch(() => {
        errorMessageElement.textContent = "Failed to sign in";
        errorMessageElement.classList.remove("hidden");
        button.disabled = false;
      });
  });
}
