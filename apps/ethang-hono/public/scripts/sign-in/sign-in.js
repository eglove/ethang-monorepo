// src/scripts/sign-in/sign-in.ts
var form = document.querySelector("#sign-in-form");
var errorMessageElement = document.querySelector("#sign-in-error");
if (form && errorMessageElement) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    fetch("https://auth.ethang.dev/sign-in", {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    }).then(async (response) => {
      if (response.ok) {
        errorMessageElement.classList.add("hidden");
        return response.json();
      }
      throw new Error("Failed to sign in");
    }).then((_data) => {
      globalThis.cookieStore.set("ethang-auth-token", _data.sessionToken).then(() => {
        globalThis.location.href = "/courses";
      }).catch(globalThis.console.error);
    }).catch(() => {
      errorMessageElement.textContent = "Failed to sign in";
      errorMessageElement.classList.remove("hidden");
    });
  });
}
