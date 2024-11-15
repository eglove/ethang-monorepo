export const openNewTab = (url: string) => {
  if ("undefined" !== typeof globalThis) {
    window.open(url, "_blank")?.focus();
  }
};
