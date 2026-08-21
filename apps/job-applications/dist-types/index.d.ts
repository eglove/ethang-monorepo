import { WorkerEntrypoint } from "cloudflare:workers";
export declare class JobApplicationsService extends WorkerEntrypoint<Env> {
    createApplication(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: import("./domain/job-application/aggregate.ts").JobApplication;
    }>;
    cycleStatus(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: import("./domain/job-application/aggregate.ts").JobApplication;
    }>;
    deleteApplication(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: boolean;
    }>;
    fetch(_request: Request): Response;
    getApplication(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: import("./domain/job-application/aggregate.ts").JobApplication;
    }>;
    getResume(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: {
            contentType: string;
            data: ArrayBuffer;
            filename: string;
            size: number;
        } | null;
    }>;
    listApplications(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: {
            items: import("./domain/job-application/aggregate.ts").JobApplication[];
            nextCursor: string | null;
        };
    }>;
    updateApplication(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: import("./domain/job-application/aggregate.ts").JobApplication;
    }>;
    uploadResume(parameters: unknown): Promise<{
        error: {
            code: import("./rpc-result.ts").ErrorCode;
            message: string;
        };
        ok: false;
    } | {
        ok: true;
        value: import("./domain/job-application/aggregate.ts").JobApplication;
    }>;
    private readonly layer;
    private readonly run;
    private readonly verify;
}
export default JobApplicationsService;
