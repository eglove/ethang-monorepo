/* eslint-disable sonar/no-duplicate-string */
import type { MarkdownBlock } from "@ethang/markdown-generator/markdown-generator.js";

export const webstormMcpDatabase: MarkdownBlock[] = [
  {
    level: 2,
    text: "Database",
    type: "header"
  },
  {
    level: 3,
    text: "`cancel_sql_query`",
    type: "header"
  },
  {
    text: "Cancels a running query using its unique ID. ",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      },
      {
        text: "`sessionId` (integer) *(Required)*: The unique ID of a query session."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`execute_sql_query`",
    type: "header"
  },
  {
    text: "Executes a SQL query against the given database connection.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.\nReports execution status (success/error) with error details when applicable.\nReturns query results in CSV format, if any.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      },
      {
        text: "`queryText` (string) *(Required)*: SQL query to be executed."
      },
      {
        text: "`schemaName` (string) *(Required)*: Name of the schema."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`get_database_object_description`",
    type: "header"
  },
  {
    text: "Retrieves the structure of a database object (columns, types, keys, indexes) within a particular schema as a hierarchical text representation.\nIn case of ambiguity returns definition of all applicable objects.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
      },
      {
        text: "`kind` (string) *(Required)*: Object kind (e.g., table, view, routine). May not be empty"
      },
      {
        text: "`objectName` (string) *(Required)*: Object name of the specified kind (e.g., table or view name). May not be empty."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      },
      {
        text: "`schemaName` (string) *(Required)*: Name of the schema."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`list_database_connections`",
    type: "header"
  },
  {
    text: "Retrieves a list of configured database connections or data sources in the project.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`list_database_schemas`",
    type: "header"
  },
  {
    text: "Retrieves a list of database schemas in the specified database connection.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      },
      {
        text: "`selectedOnly` (boolean) *(Required)*: True to list only schemas with loaded metadata, false to list all schemas."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`list_recent_sql_queries`",
    type: "header"
  },
  {
    text: "Retrieves a list of recent (including currently running) queries for the given database connection.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`list_schema_objects`",
    type: "header"
  },
  {
    text: "Retrieves a list of database objects within the given schema.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
      },
      {
        text: "`kind` (string): Object kind to filter by (e.g., table, view). If null, returns all objects in the schema."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      },
      {
        text: "`schemaName` (string) *(Required)*: Name of the schema."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`list_schema_object_kinds`",
    type: "header"
  },
  {
    text: "Retrieves supported schema object kinds (e.g., table, view, routine) for the given database connection.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`preview_table_data`",
    type: "header"
  },
  {
    text: "Previews data of the table, view, materialized view or other table-like object using given database connection.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.\nReturns table content in CSV format",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`connectionId` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`databaseName` (string) *(Required)*: Name of the database the schema belongs to. Might be empty if DBMS has no databases, but only schemas.\nTogether with `schemaName` property forms qualified schema name that uniquely identifies the schema within the connection."
      },
      {
        text: "`maxRowCount` (integer): Maximum number of rows to return. Default is 100. You must NOT pass zero or negative value for this argument."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      },
      {
        text: "`schemaName` (string) *(Required)*: Name of the schema."
      },
      {
        text: "`tableName` (string) *(Required)*: Name of the table."
      }
    ],
    type: "unorderedList"
  },
  {
    level: 3,
    text: "`test_database_connection`",
    type: "header"
  },
  {
    text: "Checks whether a specific database connection is valid and reachable.\nDo not use this tool for DDL data sources as they have no underlying DBMS connection.\nReturns connection diagnostic info.",
    type: "text"
  },
  {
    text: "**Parameters:**",
    type: "text"
  },
  {
    items: [
      {
        text: "`id` (string) *(Required)*: The unique ID of a database connection."
      },
      {
        text: "`projectPath` (string):  The project path. Pass this value ALWAYS if you are aware of it. It reduces numbers of ambiguous calls. \n In the case you know only the current working directory you can use it as the project path.\n If you're not aware about the project path you can ask user about it."
      }
    ],
    type: "unorderedList"
  }
];
