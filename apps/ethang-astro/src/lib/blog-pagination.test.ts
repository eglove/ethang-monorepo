import { describe, expect, it } from "vitest";
import { toMaxPages, toPageHref } from "./blog-pagination.ts";

describe("toMaxPages", () => {
	it.each([
		[0, 1],
		[1, 1],
		[9, 1],
		[10, 1],
		[11, 2],
		[100, 10],
	])(
		"total %i → pages %i",
		(total, pages) => expect(toMaxPages(total)).toBe(pages)
	);
	it("negative clamps to 1", () => expect(toMaxPages(-5)).toBe(1));
});
describe("toPageHref", () => {
	it.each([
		[1, "/blog"],
		[0, "/blog"],
		[2, "/blog/page/2"],
	])("page %i → %s", (page, href) => expect(toPageHref(page)).toBe(href));
});