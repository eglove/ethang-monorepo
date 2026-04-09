// Animate stages in on scroll
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 },
);

document.querySelectorAll(".stage").forEach((el) => observer.observe(el));

// Clicking a stage number scrolls to that stage and highlights it briefly
document.querySelectorAll(".stage-num").forEach((num) => {
  num.style.cursor = "pointer";
  num.addEventListener("click", () => {
    const stage = num.closest(".stage");
    stage.scrollIntoView({ behavior: "smooth", block: "center" });
    stage.style.outline = `2px solid ${getComputedStyle(num).borderColor}`;
    stage.style.outlineOffset = "4px";
    stage.style.borderRadius = "12px";
    setTimeout(() => {
      stage.style.outline = "none";
    }, 1500);
  });
});
