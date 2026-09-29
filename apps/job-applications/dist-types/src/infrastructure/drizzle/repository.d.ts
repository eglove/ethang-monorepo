import { Layer } from "effect";
import { JobApplicationRepository } from "../../application/ports/job-application-repository.ts";
export declare const createJobApplicationRepositoryLayer: (database: D1Database) => Layer.Layer<JobApplicationRepository, never, never>;
