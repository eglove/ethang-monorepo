import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  buildCrossViewDate,
  buildNavConfig,
  buildPrefetchUrls,
} from "./calendar-nav.ts";

const CHICAGO = "America/Chicago";
const JUNE_26_2026 = "2024-06-15";

describe(buildCrossViewDate, () => {
  it("returns currentMonthDt for month view", () => {
    const currentMonthDt = DateTime.fromObject(
      { day: 1, month: 6, year: 2024 },
      { zone: CHICAGO },
    );
    const result = buildCrossViewDate("month", JUNE_26_2026, currentMonthDt);

    expect(result.toISODate()).toBe("2024-06-01");
  });

  it("returns date-parsed DateTime for week view", () => {
    const currentMonthDt = DateTime.fromObject(
      { day: 1, month: 6, year: 2024 },
      { zone: CHICAGO },
    );
    const result = buildCrossViewDate("week", JUNE_26_2026, currentMonthDt);

    expect(result.toISODate()).toBe(JUNE_26_2026);
  });

  it("returns date-parsed DateTime for day view", () => {
    const currentMonthDt = DateTime.fromObject(
      { day: 1, month: 6, year: 2024 },
      { zone: CHICAGO },
    );
    const result = buildCrossViewDate("day", JUNE_26_2026, currentMonthDt);

    expect(result.toISODate()).toBe(JUNE_26_2026);
  });
});

describe(buildNavConfig, () => {
  const baseArguments = {
    date: JUNE_26_2026,
    isCurrentMonth: false,
    isCurrentWeek: false,
    isToday: false,
    month: 6,
    monthName: "June",
    nextMonth: 7,
    nextYear: 2024,
    previousMonth: 5,
    previousYear: 2024,
    today: "2024-06-01",
    year: 2024,
  };

  it("day view: heading uses formatDayHeading output format", () => {
    const config = buildNavConfig({ ...baseArguments, view: "day" });

    expect(config.heading).toContain("June");
    expect(config.heading).toContain("2024");
  });

  it("day view: nextHref shifts date by 1", () => {
    const config = buildNavConfig({ ...baseArguments, view: "day" });

    expect(config.nextHref).toBe("/calendar?view=day&date=2024-06-16");
  });

  it("day view: prevHref shifts date by -1", () => {
    const config = buildNavConfig({ ...baseArguments, view: "day" });

    expect(config.prevHref).toBe("/calendar?view=day&date=2024-06-14");
  });

  it("day view: showToday is true when not viewing today", () => {
    const config = buildNavConfig({
      ...baseArguments,
      isToday: false,
      view: "day",
    });

    expect(config.showToday).toBe(true);
  });

  it("day view: showToday is false when viewing today", () => {
    const config = buildNavConfig({
      ...baseArguments,
      isToday: true,
      view: "day",
    });

    expect(config.showToday).toBe(false);
  });

  it("month view: heading includes month name and year", () => {
    const config = buildNavConfig({ ...baseArguments, view: "month" });

    expect(config.heading).toBe("June 2024");
  });

  it("month view: nextHref uses next month/year", () => {
    const config = buildNavConfig({ ...baseArguments, view: "month" });

    expect(config.nextHref).toBe("/calendar?view=month&year=2024&month=7");
  });

  it("month view: showToday is false when viewing current month", () => {
    const config = buildNavConfig({
      ...baseArguments,
      isCurrentMonth: true,
      view: "month",
    });

    expect(config.showToday).toBe(false);
  });

  it("week view: showToday is false when viewing current week", () => {
    const config = buildNavConfig({
      ...baseArguments,
      isCurrentWeek: true,
      view: "week",
    });

    expect(config.showToday).toBe(false);
  });
});

describe(buildPrefetchUrls, () => {
  const navConfig = {
    heading: "June 2024",
    nextHref: "/calendar?view=month&year=2024&month=7",
    prevHref: "/calendar?view=month&year=2024&month=5",
    showToday: false,
    todayHref: "/calendar?view=month&year=2024&month=6",
  };
  const hrefs = {
    tabDayHref: "/calendar?view=day&date=2024-06-15",
    tabMonthHref: "/calendar?view=month&year=2024&month=6",
    tabWeekHref: "/calendar?view=week&date=2024-06-15",
  };

  it("always includes prev and next hrefs", () => {
    const urls = buildPrefetchUrls(navConfig, "month", hrefs);

    expect(urls).toContain(navConfig.prevHref);
    expect(urls).toContain(navConfig.nextHref);
  });

  it("month view: excludes tabMonthHref", () => {
    const urls = buildPrefetchUrls(navConfig, "month", hrefs);

    expect(urls).not.toContain(hrefs.tabMonthHref);
    expect(urls).toContain(hrefs.tabWeekHref);
    expect(urls).toContain(hrefs.tabDayHref);
  });

  it("week view: excludes tabWeekHref", () => {
    const urls = buildPrefetchUrls(navConfig, "week", hrefs);

    expect(urls).not.toContain(hrefs.tabWeekHref);
    expect(urls).toContain(hrefs.tabMonthHref);
  });

  it("day view: excludes tabDayHref", () => {
    const urls = buildPrefetchUrls(navConfig, "day", hrefs);

    expect(urls).not.toContain(hrefs.tabDayHref);
    expect(urls).toContain(hrefs.tabMonthHref);
  });
});
