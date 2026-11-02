import flatMap from "lodash/flatMap.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";
import reduce from "lodash/reduce.js";
import trim from "lodash/trim.js";
import { describe, expect, it } from "vitest";

import {
  countEntriesByMarker,
  entryCountLabel,
  formatStageNumber,
  isLearnMarker,
  LEARN_MARKERS,
  learnStages,
  MARKER_REGISTERS,
  markerBadgeClass,
  markerLabel,
  stageBySlug,
  stageEntries,
  stageMarkerSummary,
  totalEntryCount
} from "./learn.ts";

const JUNK_MARKERS: readonly unknown[] = [
  "Video",
  "VIDEOS",
  " video",
  "",
  null,
  undefined,
  0,
  1,
  true,
  {},
  [],
  ["video"]
];

describe("learn markers", () => {
  it("lists every register the curriculum can use", () => {
    expect(LEARN_MARKERS).toEqual([
      "video",
      "course",
      "book",
      "lab",
      "paper",
      "corpus"
    ]);
  });

  it.each(LEARN_MARKERS)("describes the %s register", (marker) => {
    const copy = MARKER_REGISTERS[marker];
    expect(copy.length).toBeGreaterThan(0);
  });

  it.each(LEARN_MARKERS)("gives %s a complete badge class", (marker) => {
    const classes = markerBadgeClass(marker);
    expect(classes).toContain("text-");
    expect(classes).toContain("border-");
  });

  it.each(LEARN_MARKERS)("capitalises the %s label", (marker) => {
    expect(markerLabel(marker)).toBe(
      marker.charAt(0).toUpperCase() + marker.slice(1)
    );
  });

  it.each(LEARN_MARKERS)("accepts %s as a marker", (marker) => {
    expect(isLearnMarker(marker)).toBe(true);
  });

  it.each(JUNK_MARKERS)("rejects %o as a marker", (value) => {
    expect(isLearnMarker(value)).toBe(false);
  });
});

describe("formatStageNumber", () => {
  it.each([
    [0, "00"],
    [1, "01"],
    [2, "02"],
    [9, "09"],
    [10, "10"],
    [11, "11"],
    [100, "100"]
  ])("pads %i to %s", (value, expected) => {
    expect(formatStageNumber(value)).toBe(expected);
  });
});

describe("entryCountLabel", () => {
  it.each([
    [0, "0 entries"],
    [1, "1 entry"],
    [2, "2 entries"],
    [11, "11 entries"]
  ])("labels %i as %s", (count, expected) => {
    expect(entryCountLabel(count)).toBe(expected);
  });
});

describe("curriculum shape", () => {
  it("covers ten stages", () => {
    expect(learnStages).toHaveLength(10);
  });

  it("numbers the stages one through ten in order", () => {
    expect(map(learnStages, "number")).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("gives every stage a unique kebab-case slug", () => {
    const slugs = map(learnStages, "slug");
    const uniqueSlugs = new Set(slugs);
    expect(uniqueSlugs.size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    }
  });

  it.each(
    map(learnStages, (stage) => {
      return [stage.number, stage] as [number, (typeof learnStages)[number]];
    })
  )("fills in the required copy for stage %i", (_number, stage) => {
    expect(stage.title.length).toBeGreaterThan(0);
    expect(stage.lede.length).toBeGreaterThan(0);
    expect(stage.doneWhen.length).toBeGreaterThan(0);
    expect(stage.groups.length).toBeGreaterThan(0);
  });

  it.each(
    map(learnStages, (stage) => {
      return [stage.slug, stage] as const;
    })
  )("gives every group in %s at least one entry", (_slug, stage) => {
    for (const group of stage.groups) {
      expect(group.entries.length).toBeGreaterThan(0);
    }
  });

  it.each(
    learnStages.flatMap((stage) => {
      return map(stageEntries(stage), (entry) => {
        return [stage.slug, entry] as const;
      });
    })
  )("gives the %s entry a title, marker, and secure url", (_slug, entry) => {
    expect(entry.title.length).toBeGreaterThan(0);
    expect(isLearnMarker(entry.marker)).toBe(true);
    if (!isNil(entry.url)) {
      /*
       * Absolute http(s) only. One source, MIT's 6.5840, serves its course
       * pages over plain HTTP and refuses 443, so the faithful link is kept
       * rather than upgraded to a URL that does not resolve.
       */
      expect(entry.url).toMatch(/^https?:\/\/[^\s]+$/u);
    }
  });

  it.each(
    map(learnStages, (stage) => {
      return [stage.slug, stage.number] as const;
    })
  )("resolves %s back to its stage", (slug, number) => {
    expect(stageBySlug(slug)?.number).toBe(number);
  });

  it("returns undefined for an unknown slug", () => {
    expect(stageBySlug("not-a-stage")).toBeUndefined();
  });
});

describe("counting", () => {
  it("flattens a stage's groups into one entry list", () => {
    const first = learnStages.at(0);
    if (isNil(first)) {
      throw new Error("the curriculum has no stages");
    }
    const flattened = stageEntries(first);
    const grouped = first.groups.flatMap((group) => {
      return group.entries;
    });
    expect(flattened).toEqual(grouped);
    expect(flattened.length).toBeGreaterThan(first.groups.length);
  });

  it("counts zero for every marker when there are no entries", () => {
    const counts = countEntriesByMarker([]);
    for (const marker of LEARN_MARKERS) {
      expect(counts[marker]).toBe(0);
    }
  });

  it("counts every marker the curriculum uses", () => {
    const entries = learnStages.flatMap((stage) => {
      return stageEntries(stage);
    });
    const counts = countEntriesByMarker(entries);
    const summed = reduce(
      LEARN_MARKERS,
      (total, marker) => {
        return total + counts[marker];
      },
      0
    );
    expect(summed).toBe(entries.length);
    for (const marker of LEARN_MARKERS) {
      expect(counts[marker]).toBeGreaterThan(0);
    }
  });

  it("totals the entries across every stage", () => {
    const expected = reduce(
      flatMap(learnStages, (stage) => {
        return stageEntries(stage);
      }),
      (total) => {
        return total + 1;
      },
      0
    );
    expect(totalEntryCount(learnStages)).toBe(expected);
    expect(totalEntryCount([])).toBe(0);
  });
});

describe("stageMarkerSummary", () => {
  it("orders markers the way the register list does", () => {
    const summary = stageMarkerSummary({
      groups: [
        {
          entries: [
            { marker: "paper", title: "A" },
            { marker: "video", title: "B" },
            { marker: "video", title: "C" }
          ]
        }
      ]
    } as never);
    expect(summary).toEqual([
      { count: 2, marker: "video" },
      { count: 1, marker: "paper" }
    ]);
  });

  it("omits markers the stage does not use", () => {
    const summary = stageMarkerSummary({
      groups: [{ entries: [{ marker: "book", title: "A" }] }]
    } as never);
    expect(summary).toEqual([{ count: 1, marker: "book" }]);
  });

  it("returns nothing when a stage has no entries", () => {
    expect(stageMarkerSummary({ groups: [] })).toEqual([]);
  });
});

describe("curriculum content", () => {
  it("names the ten stages in order", () => {
    expect(map(learnStages, "title")).toEqual([
      "Fluency",
      "How the machine works",
      "Deciding what to build",
      "Specifying so a machine can execute it",
      "Reading code you did not write",
      "Checking the result by measuring it",
      "Operating what shipped",
      "AI engineering, as engineering",
      "Judgment under uncertainty",
      "The primary record"
    ]);
  });

  it("files the SysMoBench falsifier under the specification stage", () => {
    const stage = stageBySlug("specifying-so-a-machine-can-execute-it");
    const titles = map(stageEntries(stage as never), "title");
    expect(titles).toContain("SysMoBench");
  });

  it("files the SQLite testing page under the measurement stage", () => {
    const stage = stageBySlug("checking-the-result-by-measuring-it");
    const titles = map(stageEntries(stage as never), "title");
    expect(titles).toContain("How SQLite is tested");
  });

  it("keeps a prove-it check on every stage", () => {
    for (const stage of learnStages) {
      expect(trim(stage.doneWhen).length).toBeGreaterThan(10);
    }
  });
});
