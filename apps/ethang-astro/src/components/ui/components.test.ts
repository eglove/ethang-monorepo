import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";

import profileImage from "../../assets/profile.jpeg";
import Blockquote from "./Blockquote.astro";
import Button from "./Button.astro";
import Card from "./Card.astro";
import CodeBlock from "./CodeBlock.astro";
import FieldLabel from "./FieldLabel.astro";
import Heading from "./Heading.astro";
import InlineLink from "./InlineLink.astro";
import Page from "./Page.astro";
import Pagination from "./Pagination.astro";
import PostImage from "./PostImage.astro";
import TextInput from "./TextInput.astro";
import VideoEmbed from "./VideoEmbed.astro";

const render = async (
	component: never,
	options: Record<string, never> = {},
) => {
	const container = await AstroContainer.create();
	return container.renderToString(component, options);
};

describe("Card", () => {
	it("renders the slot with the default surface", async () => {
		const html = await render(
			Card as never,
			{
				props: { class: "extra" },
				slots: { default: "Hello" },
			} as never,
		);

		expect(html).toContain("Hello");
		expect(html).toContain("surface-card ");
		expect(html).toContain("extra");
	});

	it("applies the tinted surface when tint is set", async () => {
		const html = await render(
			Card as never,
			{
				props: { tint: true },
				slots: { default: "Tinted" },
			} as never,
		);

		expect(html).toContain("surface-card-tint");
	});
});

describe("Button", () => {
	it.each([
		{ name: "default submit", props: {}, slot: "Send" },
		{ name: "reset type", props: { type: "reset" }, slot: "Reset" },
		{ name: "button type", props: { type: "button" }, slot: "More" },
		{ name: "disabled", props: { disabled: true }, slot: "Go" },
		{
			name: "small danger",
			props: { size: "sm", variant: "danger" },
			slot: "Delete",
		},
		{ name: "xs ghost", props: { size: "xs", variant: "ghost" }, slot: "Skip" },
		{ name: "gradient", props: { variant: "gradient" }, slot: "Sign in" },
		{ name: "outline", props: { variant: "outline" }, slot: "Cancel" },
		{
			name: "with aria-label",
			props: { ariaLabel: "Save changes" },
			slot: "Save",
		},
	])("renders $name", async ({ props, slot }) => {
		const html = await render(
			Button as never,
			{
				props,
				slots: { default: slot },
			} as never,
		);

		expect(html).toContain(slot);
		expect(html).toContain("<button");
	});

	it("defaults to type submit and primary variant", async () => {
		const html = await render(
			Button as never,
			{
				slots: { default: "Hi" },
			} as never,
		);

		expect(html).toContain('type="submit"');
		expect(html).toContain("bg-primary");
	});
});

describe("Heading", () => {
	it.each([
		{ as: "h1", tag: "h1" },
		{ as: "h2", tag: "h2" },
		{ as: "h3", tag: "h3" },
		{ as: "h4", tag: "h4" },
	])("renders as $tag", async ({ as, tag }) => {
		const html = await render(
			Heading as never,
			{
				props: { as },
				slots: { default: "Title" },
			} as never,
		);

		expect(html).toContain(`<${tag}`);
		expect(html).toContain("Title");
	});

	it("defaults to h2", async () => {
		const html = await render(
			Heading as never,
			{
				slots: { default: "Default" },
			} as never,
		);

		expect(html).toContain("<h2");
	});
});

describe("InlineLink", () => {
	it.each([
		{ name: "primary", variant: "primary" },
		{ name: "nav", variant: "nav" },
		{ name: "underline", variant: "underline" },
	])("renders the $name variant", async ({ variant }) => {
		const html = await render(
			InlineLink as never,
			{
				props: { href: "/x", variant },
				slots: { default: "Link" },
			} as never,
		);

		expect(html).toContain('href="/x"');
		expect(html).toContain("Link");
	});

	it("passes target, rel, and aria-label", async () => {
		const html = await render(
			InlineLink as never,
			{
				props: {
					ariaLabel: "Open",
					href: "https://example.com",
					rel: "noopener",
					target: "_blank",
				},
				slots: { default: "Extern" },
			} as never,
		);

		expect(html).toContain('href="https://example.com"');
		expect(html).toContain('target="_blank"');
		expect(html).toContain('rel="noopener"');
		expect(html).toContain('aria-label="Open"');
	});
});

describe("Pagination", () => {
	it("renders nothing when there is only one page", async () => {
		const html = await render(
			Pagination as never,
			{
				props: {
					linkFor: () => {
						return "/blog/page/1";
					},
					maxPages: 1,
					page: 1,
				},
			} as never,
		);

		expect(html).not.toContain("nav");
	});

	it("disables the previous edge on the first page", async () => {
		const html = await render(
			Pagination as never,
			{
				props: {
					linkFor: (n: number) => {
						return `/blog/page/${n}`;
					},
					maxPages: 3,
					page: 1,
				},
			} as never,
		);

		expect(html).toContain("lsaquo");
		expect(html).toContain('aria-hidden="true"');
		expect(html).toContain('rel="next"');
	});

	it("disables the next edge on the last page and marks the active number", async () => {
		const html = await render(
			Pagination as never,
			{
				props: {
					linkFor: (n: number) => {
						return `/blog/page/${n}`;
					},
					maxPages: 2,
					page: 2,
				},
			} as never,
		);

		expect(html).toContain('rel="prev"');
		expect(html).toContain('aria-current="page"');
		expect(html).toContain("rsaquo");
	});
});

describe("Blockquote", () => {
	it("omits the footer when no author or source is given", async () => {
		const html = await render(
			Blockquote as never,
			{
				slots: { default: "Quote" },
			} as never,
		);

		expect(html).toContain("Quote");
		expect(html).not.toContain("<footer");
	});

	it("renders an author without a source", async () => {
		const html = await render(
			Blockquote as never,
			{
				props: { author: "Ada" },
				slots: { default: "Q" },
			} as never,
		);

		expect(html).toContain("Ada");
		expect(html).toContain("<footer");
	});

	it("renders a source as a link when a source URL is provided", async () => {
		const html = await render(
			Blockquote as never,
			{
				props: {
					author: "Ada",
					source: "Docs",
					sourceUrl: "https://docs.example",
				},
				slots: { default: "Q" },
			} as never,
		);

		expect(html).toContain('href="https://docs.example"');
		expect(html).toContain("Docs");
	});

	it("renders a source as a cite when no URL is provided", async () => {
		const html = await render(
			Blockquote as never,
			{
				props: { source: "Book" },
				slots: { default: "Q" },
			} as never,
		);

		expect(html).toContain("<cite>Book</cite>");
	});
});

describe("Page", () => {
	it("applies the page container classes and the extra class", async () => {
		const html = await render(
			Page as never,
			{
				props: { class: "pt-4" },
				slots: { default: "Body" },
			} as never,
		);

		expect(html).toContain("max-w-6xl");
		expect(html).toContain("pt-4");
		expect(html).toContain("Body");
	});
});

describe("FieldLabel", () => {
	it("binds to the input id and renders the slot", async () => {
		const html = await render(
			FieldLabel as never,
			{
				props: { for: "email" },
				slots: { default: "Email" },
			} as never,
		);

		expect(html).toContain('for="email"');
		expect(html).toContain("Email");
	});
});

describe("TextInput", () => {
	it.each([
		{ name: "defaults to text", props: {} },
		{
			name: "email type",
			props: { id: "email", name: "email", type: "email" },
		},
		{ name: "password type", props: { name: "password", type: "password" } },
		{
			name: "required with placeholder",
			props: { placeholder: "Type", required: true },
		},
		{ name: "with value and class", props: { class: "mt-2", value: "hi" } },
	])("renders $name", async ({ props }) => {
		const html = await render(TextInput as never, { props } as never);

		expect(html).toContain("<input");
	});

	it("defaults to type text", async () => {
		const html = await render(TextInput as never, {});

		expect(html).toContain('type="text"');
	});
});

describe("VideoEmbed", () => {
	it.each([
		{ name: "raw video id", props: { videoId: "dQw4w9WgXcQ" } },
		{
			name: "watch URL",
			props: { url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
		},
		{ name: "short URL", props: { url: "https://youtu.be/dQw4w9WgXcQ" } },
		{
			name: "embed URL",
			props: { url: "https://www.youtube.com/embed/dQw4w9WgXcQ" },
		},
	])("builds the no-cookie embed URL from $name", async ({ props }) => {
		const html = await render(VideoEmbed as never, { props } as never);

		expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
	});

	it("renders nothing when no id or url is given", async () => {
		const html = await render(VideoEmbed as never, {});

		expect(html).not.toContain("iframe");
	});

	it("renders nothing when the url has no recognizable id", async () => {
		const html = await render(
			VideoEmbed as never,
			{
				props: { url: "https://example.com/nope" },
			} as never,
		);

		expect(html).not.toContain("iframe");
	});

	it("uses a custom title when provided", async () => {
		const html = await render(
			VideoEmbed as never,
			{
				props: { title: "Demo", videoId: "dQw4w9WgXcQ" },
			} as never,
		);

		expect(html).toContain('title="Demo"');
	});

	it("falls back to the default title", async () => {
		const html = await render(
			VideoEmbed as never,
			{
				props: { videoId: "dQw4w9WgXcQ" },
			} as never,
		);

		expect(html).toContain('title="YouTube video"');
	});

	it("ignores an empty video id and falls back to the url", async () => {
		const html = await render(
			VideoEmbed as never,
			{
				props: { url: "https://youtu.be/dQw4w9WgXcQ", videoId: "" },
			} as never,
		);

		expect(html).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");
	});
});

describe("PostImage", () => {
	it("renders the image with a bare alt attribute when none is given", async () => {
		const html = await render(
			PostImage as never,
			{
				props: { src: profileImage },
			} as never,
		);

		expect(html).toContain("<img");
		expect(html).toMatch(/<img[^>]*\balt\b/u);
		expect(html).toContain('loading="lazy"');
	});

	it("renders a caption when provided", async () => {
		const html = await render(
			PostImage as never,
			{
				props: { alt: "Profile", caption: "Me", src: profileImage },
			} as never,
		);

		expect(html).toContain("<figcaption");
		expect(html).toContain("Me");
	});

	it("omits the caption when the caption is empty", async () => {
		const html = await render(
			PostImage as never,
			{
				props: { alt: "Profile", caption: "", src: profileImage },
			} as never,
		);

		expect(html).not.toContain("<figcaption");
	});
});

describe("CodeBlock", () => {
	it.each([
		{ expected: "ts", lang: "ts", name: "valid language" },
		{ expected: "plaintext", lang: "klingon", name: "unknown language" },
		{ expected: "plaintext", lang: null, name: "missing language" },
	])("sanitizes the language for $name", async ({ expected, lang }) => {
		const html = await render(
			CodeBlock as never,
			{
				props: { code: "const x = 1;", lang },
			} as never,
		);

		expect(html).toContain("astro-code");
		expect(html).toContain(`data-language="${expected}"`);
	});
});
