import { Effect } from "effect";
import type { Database } from "../../data/types.ts";
import type { Curriculum } from "../../domain/curriculum/state.ts";
import { SaveError } from "../../errors/save-error.ts";
import { ValidationError } from "../../errors/validation-error.ts";
export type CurriculumRepo = {
    readonly save: (curriculum: Curriculum) => Effect.Effect<Curriculum, SaveError>;
    readonly validateLearningPathIds: (ids: readonly string[]) => Effect.Effect<void, ValidationError>;
};
export declare const createCurriculumRepo: (database: Database) => {
    save: (curriculum: Curriculum) => Effect.Effect<{
        learningPathIds: readonly string[];
        curriculumId: string;
        name: string;
        url: string | null;
    }, SaveError, never>;
    validateLearningPathIds: (ids: readonly string[]) => Effect.Effect<void, ValidationError, never>;
};
