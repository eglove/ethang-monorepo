import { Effect, Layer } from "effect";
import isNil from "lodash/isNil.js";

import { ResumeStore } from "../../application/ports.ts";
import { ResumeError } from "../../errors/resume-error.ts";

export const createResumeStoreLayer = (bucket: R2Bucket) => {
  return Layer.succeed(ResumeStore, {
    delete: (key) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new ResumeError(String(cause));
        },
        try: async () => {
          await bucket.delete(key);
        }
      });
    },
    get: (key) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new ResumeError(String(cause));
        },
        try: async () => {
          const object = await bucket.get(key);
          if (isNil(object)) {
            return null;
          }
          return {
            data: await object.arrayBuffer(),
            filename: object.customMetadata?.["filename"] ?? "",
            size: object.size
          };
        }
      });
    },
    put: (key, data, filename) => {
      return Effect.tryPromise({
        catch: (cause) => {
          return new ResumeError(String(cause));
        },
        try: async () => {
          await bucket.put(key, data, {
            customMetadata: { filename },
            httpMetadata: { contentType: "application/pdf" }
          });
        }
      });
    }
  });
};
