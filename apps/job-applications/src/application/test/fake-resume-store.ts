import { type Context, Effect, Layer } from "effect";

import { ResumeError } from "../../errors/resume-error.ts";
import { ResumeStore } from "../ports/resume-store.ts";

type Store = Context.Tag.Service<typeof ResumeStore>;

export const createFakeResumeStore = (options?: { failDelete?: boolean }) => {
  const objects = new Map<
    string,
    { data: ArrayBuffer; filename: string; size: number }
  >();
  const store: Store = {
    delete: (key) => {
      if (true === options?.failDelete) {
        return Effect.fail(new ResumeError("r2 delete failed"));
      }
      objects.delete(key);
      // eslint-disable-next-line no-undefined
      return Effect.succeed(undefined);
    },
    get: (key) => {
      return Effect.succeed(objects.get(key) ?? null);
    },
    put: (key, data, filename) => {
      objects.set(key, { data, filename, size: data.byteLength });
      // eslint-disable-next-line no-undefined
      return Effect.succeed(undefined);
    },
  };
  return { layer: Layer.succeed(ResumeStore, store), objects };
};
