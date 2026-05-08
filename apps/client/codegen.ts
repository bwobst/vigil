import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../server/schema.graphql",
  documents: ["src/gql/documents/*.graphql"],
  generates: {
    "src/gql/generated/": {
      preset: "client",
      config: {
        scalars: {
          DateTime: "string",
        },
      },
    },
  },
};

export default config;
