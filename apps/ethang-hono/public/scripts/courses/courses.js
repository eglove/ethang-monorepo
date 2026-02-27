// src/scripts/courses/courses.ts
for (const button of document.querySelectorAll("[data-scroll-top]")) {
  button.addEventListener("click", () => {
    window.scrollTo({ behavior: "smooth", top: 0 });
  });
}
for (const link of document.querySelectorAll("[data-toc-link]")) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    const href = link.getAttribute("href");
    if (null === href) {
      return;
    }
    const id = href.slice(1);
    const element = document.querySelector(`#${id}`);
    if (element) {
      const offset = 32;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({
        behavior: "smooth",
        top: offsetPosition
      });
    }
  });
}
