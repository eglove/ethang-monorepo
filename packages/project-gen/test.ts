import { generateProject } from "./src";

generateProject({
  importMetaUrl: import.meta.url,
  includeGraphqlScalars: ["Date"],
  models: [
    {
      fields: [
        {
          isRequired: true,
          name: "id",
          prismaAnnotation: "@id @default(uuid(7))",
          type: "String",
        },
        { isRequired: true, name: "firstName", type: "String" },
        { isRequired: true, name: "lastName", type: "String" },
        {
          isRequired: true,
          name: "createdAt",
          prismaAnnotation: "@default(now())",
          type: "DateTime",
        },
        {
          isRequired: true,
          name: "updatedAt",
          prismaAnnotation: "@updatedAt",
          type: "DateTime",
        },
      ],
      name: "Person",
      relationFields: [{ model: "Address", name: "Address" }],
    },
    {
      fields: [
        {
          isRequired: true,
          name: "id",
          prismaAnnotation: "@id @default(uuid(7))",
          type: "String",
        },
        { name: "street", type: "String" },
        { name: "city", type: "String" },
        { name: "state", type: "String" },
        { name: "zipCode", type: "Int" },
        {
          isRequired: true,
          name: "createdAt",
          prismaAnnotation: "@default(now())",
          type: "DateTime",
        },
        {
          isRequired: true,
          name: "updatedAt",
          prismaAnnotation: "@updatedAt",
          type: "DateTime",
        },
      ],
      name: "Address",
      relationFields: [{ model: "Person[]", name: "Persons" }],
    },
  ],
  outputDir: "dist",
  prismaOptions: {
    databaseEnvKey: "DATABASE_URL",
  },
});
