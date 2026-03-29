import isElement from "lodash/isElement.js";
import isNil from "lodash/isNil.js";
import isPlainObject from "lodash/isPlainObject.js";
import isString from "lodash/isString.js";

const isHtmlElementNode = (node: Node): node is HTMLElement => isElement(node);

const isManifestRecord = (value: unknown): value is Record<string, string> =>
  isPlainObject(value);

const parseManifest = (): Record<string, string> => {
  const text = document.querySelector("#script-manifest")?.textContent ?? "{}";
  const parsed: unknown = JSON.parse(text);
  return isManifestRecord(parsed) ? parsed : {};
};

const manifest = parseManifest();
const loaded = new Set<string>();

const loadScript = (id: string): void => {
  const url = manifest[id];
  if (isNil(url) || loaded.has(id)) return;
  loaded.add(id);
  import(url).catch(globalThis.console.error);
};

const processElement = (element: HTMLElement): void => {
  const id = element.dataset["script"];
  if (isString(id)) loadScript(id);
};

const processElements = (
  elements: HTMLElement[] | NodeListOf<HTMLElement>,
): void => {
  for (const element of elements) {
    processElement(element);
  }
};

const processAddedNode = (node: Node): void => {
  if (!isHtmlElementNode(node)) return;
  processElement(node);
  processElements(node.querySelectorAll<HTMLElement>("[data-script]"));
};

// Initial scan — picks up all [data-script] elements already in the parsed DOM
processElements(document.querySelectorAll<HTMLElement>("[data-script]"));

// MutationObserver — handles dynamically added elements for future interaction-based loading
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      processAddedNode(node);
    }
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
});
