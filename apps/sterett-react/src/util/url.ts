export const openNewTab = (url: string) => {
  if ("undefined" !== typeof globalThis) {
    globalThis.open(url, "_blank")?.focus();
  }
};
