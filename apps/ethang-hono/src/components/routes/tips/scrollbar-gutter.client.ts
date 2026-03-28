const button = document.querySelector("#scrollbar-gutter-show-extra-content");
const withContainer = document.querySelector("#scrollbar-gutter-with-example");
const withoutContainer = document.querySelector(
  "#scrollbar-gutter-without-example",
);
let isExtraContentVisible = false;

button?.addEventListener("click", () => {
  isExtraContentVisible = !isExtraContentVisible;

  if (isExtraContentVisible) {
    button.textContent = "Hide extra content";
    withContainer?.classList.remove("hidden");
    withoutContainer?.classList.remove("hidden");
  } else {
    button.textContent = "Show extra content";
    withContainer?.classList.add("hidden");
    withoutContainer?.classList.add("hidden");
  }
});
