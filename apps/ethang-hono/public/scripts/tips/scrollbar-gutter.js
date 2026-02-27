// src/scripts/tips/scrollbar-gutter.ts
var button = document.querySelector("#scrollbar-gutter-show-extra-content");
var withContainer = document.querySelector("#scrollbar-gutter-with-example");
var withoutContainer = document.querySelector(
  "#scrollbar-gutter-without-example"
);
var isExtraContentVisible = false;
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
