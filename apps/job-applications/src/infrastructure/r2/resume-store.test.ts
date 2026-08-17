import { env } from "cloudflare:workers";
import { Effect } from "effect";
import map from "lodash/map.js";
import { beforeEach, describe, expect, it } from "vitest";

import { ResumeStore } from "../../application/ports.ts";
import { createResumeStoreLayer } from "./resume-store.ts";

const layer = createResumeStoreLayer(env.jobResumes);
const ENCODER = new TextEncoder();
const DATA = ENCODER.encode("%PDF-1.7 fake").buffer;
const DATA2 = ENCODER.encode("%PDF-1.7 second").buffer;
const KEY = "me@example.com/1";

const run = async (effect: Effect.Effect<unknown, unknown, ResumeStore>) => {
  return Effect.runPromise(Effect.provide(effect, layer));
};

beforeEach(async () => {
  const listResult = await env.jobResumes.list();
  await Promise.all(
    map(listResult.objects, async ({ key }) => {
      return env.jobResumes.delete(key);
    })
  );
});

describe("resume store", () => {
  it("puts, gets and deletes an object", async () => {
    await run(
      Effect.gen(function* () {
        const store = yield* ResumeStore;
        yield* store.put(KEY, DATA, "resume.pdf");
        const object = yield* store.get(KEY);
        expect(object?.filename).toBe("resume.pdf");
        expect(object?.size).toBe(DATA.byteLength);
        yield* store.delete(KEY);
        const gone = yield* store.get(KEY);
        expect(gone).toBeNull();
      })
    );
  });

  it("overwrites in place (no orphan objects)", async () => {
    await run(
      Effect.gen(function* () {
        const store = yield* ResumeStore;
        yield* store.put(KEY, DATA, "a.pdf");
        yield* store.put(KEY, DATA2, "b.pdf");
        const list = yield* Effect.promise(async () => {
          return env.jobResumes.list();
        });
        expect(list.objects).toHaveLength(1);
        const object = yield* store.get(KEY);
        expect(object?.filename).toBe("b.pdf");
      })
    );
  });
});
