const button = document.querySelector<HTMLButtonElement>(
  "[aria-controls='navbar-default']",
);
const menu = document.querySelector<HTMLElement>("#navbar-default");

button?.addEventListener("click", () => {
  const isExpanded = "true" === button.getAttribute("aria-expanded");
  button.setAttribute("aria-expanded", String(!isExpanded));
  menu?.classList.toggle("hidden");
});
