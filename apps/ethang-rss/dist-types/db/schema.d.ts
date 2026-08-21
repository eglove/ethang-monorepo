export declare const feedsTable: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "feeds";
    schema: undefined;
    columns: {
        iconUrl: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "iconUrl";
            tableName: "feeds";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "feeds";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        lastFetchedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "lastFetchedAt";
            tableName: "feeds";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        title: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "title";
            tableName: "feeds";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        website: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "website";
            tableName: "feeds";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        xmlAddress: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "xmlAddress";
            tableName: "feeds";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const feedsRelations: import("drizzle-orm").Relations<"feeds", {
    articles: import("drizzle-orm").Many<"articles">;
    subscriptions: import("drizzle-orm").Many<"subscriptions">;
}>;
export declare const articlesTable: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "articles";
    schema: undefined;
    columns: {
        content: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "content";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        feedId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "feedId";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        guid: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "guid";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        link: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "link";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        publishedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "publishedAt";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        title: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "title";
            tableName: "articles";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const articlesRelations: import("drizzle-orm").Relations<"articles", {
    feed: import("drizzle-orm").One<"feeds", true>;
    userStates: import("drizzle-orm").Many<"user_item_states">;
}>;
export declare const subscriptionsTable: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "subscriptions";
    schema: undefined;
    columns: {
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "createdAt";
            tableName: "subscriptions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        feedId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "feedId";
            tableName: "subscriptions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "subscriptions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        userId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "userId";
            tableName: "subscriptions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const subscriptionsRelations: import("drizzle-orm").Relations<"subscriptions", {
    feed: import("drizzle-orm").One<"feeds", true>;
}>;
export declare const userItemStatesTable: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "user_item_states";
    schema: undefined;
    columns: {
        articleId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "articleId";
            tableName: "user_item_states";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "user_item_states";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
        isBookmarked: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "isBookmarked";
            tableName: "user_item_states";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
            driverParam: number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isRead: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "isRead";
            tableName: "user_item_states";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
            driverParam: number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        userId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "userId";
            tableName: "user_item_states";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: undefined;
        }>;
    };
    dialect: "sqlite";
}>;
export declare const userItemStatesRelations: import("drizzle-orm").Relations<"user_item_states", {
    article: import("drizzle-orm").One<"articles", true>;
}>;
