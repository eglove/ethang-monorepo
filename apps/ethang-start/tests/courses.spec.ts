import forEach from "lodash/forEach.js";

import { expect, test } from "./fixtures.ts";

const COURSES_URL = "/courses";

test.describe("Courses page — structure", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(COURSES_URL);
	});

	test("has the expected document title", async ({ page }) => {
		await expect(page.title()).resolves.toBe("EthanG");
	});

	test("renders a main landmark", async ({ page }) => {
		const main = page.getByRole("main");
		await expect(main).toBeVisible();
	});

	test("displays the Courses heading", async ({ page }) => {
		const heading = page.getByRole("heading", { level: 1, name: "Courses" });
		await expect(heading).toBeVisible();
	});

	test("shows the last-updated timestamp", async ({ page }) => {
		const timestamp = page.getByText(/Last Updated:/iu);
		await expect(timestamp).toBeVisible();
	});

	test("formats the last-updated timestamp with date and time components", async ({
		page,
	}) => {
		// Match "Last Updated: <Day>, <Month> <Date>, <Year> at <Time> UTC"
		const timestamp = page.getByText(
			/Last Updated: \w+, \w+ \d+, \d{4} at [\d:]+ [AP]M UTC/u,
		);
		await expect(timestamp).toBeVisible();
	});

	test("marks the Courses navigation link as active", async ({ page }) => {
		const coursesLink = page.getByRole("link", { name: "Courses" });
		await expect(coursesLink).toBeVisible();
		await expect(coursesLink).toHaveAttribute("href", COURSES_URL);
	});
});

test.describe("Courses page — learning path cards", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(COURSES_URL);
	});

	forEach(
		[
			"Colt Steele",
			"Academind: Frontend",
			"Academind: Backend",
			"Academind: React",
			"Academind: Angular",
			"Atomic Design",
		] as const,
		(heading) => {
			test(`displays the learning path heading '${heading}'`, async ({
				page,
			}) => {
				const h2 = page.getByRole("heading", { level: 2, name: heading });
				await expect(h2).toBeVisible();
			});
		},
	);

	test("displays the standalone 'Advanced' learning path heading", async ({
		page,
	}) => {
		const h2 = page.getByRole("heading", {
			exact: true,
			level: 2,
			name: "Advanced",
		});
		await expect(h2).toBeVisible();
	});

	forEach(
		[
			"Software Construction",
			"Software Testing",
			"Software Design",
			"Computing Foundations",
		] as const,
		(swebokFocus) => {
			test(`shows the swebok focus badge '${swebokFocus}'`, async ({
				page,
			}) => {
				await expect(page.getByText(swebokFocus).first()).toBeVisible();
			});
		},
	);

	forEach(
		[
			"6 courses",
			"3 courses",
			"5 courses",
			"4 courses",
			"2 courses",
			"10 courses",
		] as const,
		(count) => {
			test(`displays a course count '${count}'`, async ({ page }) => {
				await expect(
					page.getByText(new RegExp(`^${count}$`, "u")).first(),
				).toBeVisible();
			});
		},
	);
});

test.describe("Courses page — external links", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(COURSES_URL);
	});

	forEach(
		[
			{ name: "Colt Steele", url: "https://www.udemy.com/user/coltsteele/" },
			{
				name: "Frontend Masters: Beginner",
				url: "https://frontendmasters.com/learn/beginner/",
			},
			{
				name: "Pluralsight: Design Patterns in C#",
				url: "https://app.pluralsight.com/paths/skill/design-patterns-in-c",
			},
		] as const,
		({ name, url }) => {
			test(`links the learning path '${name}' to its external URL`, async ({
				page,
			}) => {
				const heading = page.getByRole("heading", { level: 2, name });
				await expect(heading).toBeVisible();
				const link = heading.locator("a");
				await expect(link).toBeVisible();
				await expect(link).toHaveAttribute("href", url);
				await expect(link).toHaveAttribute("target", "_blank");
			});
		},
	);
});

test.describe("Courses page — course listings", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto(COURSES_URL);
	});

	forEach(
		[
			"The HTML & CSS Bootcamp",
			"JavaScript—The Complete Guide",
			"Patterns.dev",
		] as const,
		(courseName) => {
			test(`displays the course '${courseName}'`, async ({ page }) => {
				const link = page.getByRole("link", { name: courseName });
				await expect(link).toBeVisible();
			});
		},
	);

	test("displays the 'React—The Complete Guide' course with exact match", async ({
		page,
	}) => {
		const link = page.getByRole("link", {
			exact: true,
			name: "React—The Complete Guide",
		});
		await expect(link).toBeVisible();
	});

	forEach(
		["by Colt Steele", "by Academind", "by Frontend Masters"] as const,
		(authorText) => {
			test(`shows the author attribution '${authorText}'`, async ({ page }) => {
				await expect(page.getByText(authorText).first()).toBeVisible();
			});
		},
	);

	forEach(
		[
			"https://www.udemy.com/course/html-and-css-bootcamp/",
			"https://acad.link/js",
			"https://frontendmasters.com/courses/web-development-v3/",
		] as const,
		(url) => {
			test(`links to a course with the correct href '${url}'`, async ({
				page,
			}) => {
				const link = page.locator(`a[href="${url}"]`);
				await expect(link).toBeVisible();
				await expect(link).toHaveAttribute("target", "_blank");
			});
		},
	);
});
