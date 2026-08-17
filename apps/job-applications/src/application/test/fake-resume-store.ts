import { type Context, Effect, Layer } from "effect";

import { ResumeStore } from "../ports.ts";

type Store = Context.Tag.Service<typeof ResumeStore>;

export const createFakeResumeStore = () => {
  const objects = new Map<
    string,
    { data: ArrayBuffer; filename: string; size: number }
  >();
  const store: Store = {
    delete: (key) => {
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
    }
  };
  return { layer: Layer.succeed(ResumeStore, store), objects };
};
