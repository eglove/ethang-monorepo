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
    fetch("https://auth.ethang.dev/sign-in", {
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
      .then((_data) => {
        globalThis.cookieStore
          .set("ethang-auth-token", _data.sessionToken)
          .then(() => {
            globalThis.location.href = "/courses";
            button.disabled = false;
          })
          .catch(globalThis.console.error);
      })
      .catch(() => {
        errorMessageElement.textContent = "Failed to sign in";
        errorMessageElement.classList.remove("hidden");
        button.disabled = false;
      });
  });
}
