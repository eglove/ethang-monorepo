import { Layer } from "effect";
import { ResumeStore } from "../../application/ports/resume-store.ts";
export declare const createResumeStoreLayer: (bucket: R2Bucket) => Layer.Layer<ResumeStore, never, never>;
