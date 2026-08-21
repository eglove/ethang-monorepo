export type Connection<T> = {
    edges: {
        cursor: string;
        node: T;
    }[];
    pageInfo: {
        endCursor: null | string;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: null | string;
    };
};
export declare const createConnection: <T extends {
    id: string;
}>(items: T[], hasNextPage: boolean) => {
    edges: {
        cursor: string;
        node: T;
    }[];
    pageInfo: {
        endCursor: string | null;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor: string | null;
    };
};
