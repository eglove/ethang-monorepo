import { WorkerEntrypoint } from "cloudflare:workers";
export declare class CoursesService extends WorkerEntrypoint<Env> {
    course(parameters: {
        id: string;
    }): Promise<{
        author: string;
        createdAt: string;
        id: string;
        name: string;
        updatedAt: string;
        url: string;
    } | null>;
    courses(): Promise<{
        author: string;
        createdAt: string;
        id: string;
        name: string;
        updatedAt: string;
        url: string;
    }[]>;
    coursesAll(): Promise<{
        author: string;
        courseId: string;
        courseIndex: number;
        learningPathId: string;
        learningPathName: null | string;
        learningPathOrder: number;
        learningPathUrl: null | string;
        name: string;
        swebokFocus: null | string;
        updatedAt: string;
        url: string;
    }[]>;
    courseTracking(parameters: {
        courseId: string;
        userId: string;
    }): Promise<{
        courseUrl: string;
        id: string;
        status: string;
        userId: string;
    } | null>;
    courseTrackings(parameters: {
        after?: string;
        first?: number;
        userId: string;
    }): Promise<{
        courseUrl: string;
        id: string;
        status: string;
        userId: string;
    }[]>;
    createCurriculum(parameters: {
        learningPathIds?: null | string[];
        name: string;
        url?: null | string;
    }): Promise<import("./domain/curriculum/state.ts").Curriculum>;
    curriculum(parameters: {
        id: string;
    }): Promise<{
        id: string;
        learningPaths: {
            courses: {
                author: string;
                createdAt: string;
                id: string;
                name: string;
                updatedAt: string;
                url: string;
            }[];
            url: string | null;
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            swebokFocus: string;
        }[];
        url: string | null;
        createdAt: string;
        name: string;
        updatedAt: string;
    } | null>;
    curriculums(): Promise<{
        id: string;
        learningPaths: {
            courses: {
                author: string;
                createdAt: string;
                id: string;
                name: string;
                updatedAt: string;
                url: string;
            }[];
            url: string | null;
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
            swebokFocus: string;
        }[];
        url: string | null;
        createdAt: string;
        name: string;
        updatedAt: string;
    }[]>;
    cycleCourseTrackingStatus(parameters: {
        courseId: string;
        userId: string;
    }): Promise<{
        readonly id: string;
    } & import("./domain/course-tracking/state.ts").CourseTrackingState>;
    fetch(_request: Request): Response;
    learningPath(parameters: {
        id: string;
    }): Promise<{
        courses: {
            author: string;
            createdAt: string;
            id: string;
            name: string;
            updatedAt: string;
            url: string;
        }[];
        createdAt: string;
        id: string;
        name: string;
        swebokFocus: string;
        updatedAt: string;
        url: string | null;
    } | null>;
    learningPaths(): Promise<{
        courses: {
            author: string;
            createdAt: string;
            id: string;
            name: string;
            updatedAt: string;
            url: string;
        }[];
        createdAt: string;
        id: string;
        name: string;
        swebokFocus: string;
        updatedAt: string;
        url: string | null;
    }[]>;
    private getDb;
}
export default CoursesService;
