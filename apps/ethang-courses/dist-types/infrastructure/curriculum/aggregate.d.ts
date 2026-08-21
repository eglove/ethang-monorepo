import { Effect } from "effect";
import type { Curriculum } from "../../domain/curriculum/state.ts";
import type { CurriculumRepo } from "./repo.ts";
export declare const createCurriculum: (parameters: {
    learningPathIds: readonly string[];
    name: string;
    url?: null | string;
}, repo: CurriculumRepo) => Effect.Effect<Curriculum, import("../../errors/save-error.ts").SaveError | import("../../errors/validation-error.ts").ValidationError, never>;
