/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "query Watches {\n  watches {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nquery Watch($id: ID!) {\n  watch(id: $id) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation CreateWatch($input: CreateWatchInput!) {\n  createWatch(input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateWatch($id: ID!, $input: UpdateWatchInput!) {\n  updateWatch(id: $id, input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteWatch($id: ID!) {\n  deleteWatch(id: $id)\n}\n\nquery WatchRuns($watchId: ID!) {\n  watchRuns(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}\n\nmutation RunWatch($watchId: ID!) {\n  runWatch(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}": typeof types.WatchesDocument,
};
const documents: Documents = {
    "query Watches {\n  watches {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nquery Watch($id: ID!) {\n  watch(id: $id) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation CreateWatch($input: CreateWatchInput!) {\n  createWatch(input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateWatch($id: ID!, $input: UpdateWatchInput!) {\n  updateWatch(id: $id, input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteWatch($id: ID!) {\n  deleteWatch(id: $id)\n}\n\nquery WatchRuns($watchId: ID!) {\n  watchRuns(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}\n\nmutation RunWatch($watchId: ID!) {\n  runWatch(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}": types.WatchesDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query Watches {\n  watches {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nquery Watch($id: ID!) {\n  watch(id: $id) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation CreateWatch($input: CreateWatchInput!) {\n  createWatch(input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateWatch($id: ID!, $input: UpdateWatchInput!) {\n  updateWatch(id: $id, input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteWatch($id: ID!) {\n  deleteWatch(id: $id)\n}\n\nquery WatchRuns($watchId: ID!) {\n  watchRuns(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}\n\nmutation RunWatch($watchId: ID!) {\n  runWatch(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}"): (typeof documents)["query Watches {\n  watches {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nquery Watch($id: ID!) {\n  watch(id: $id) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation CreateWatch($input: CreateWatchInput!) {\n  createWatch(input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation UpdateWatch($id: ID!, $input: UpdateWatchInput!) {\n  updateWatch(id: $id, input: $input) {\n    id\n    name\n    targetUrl\n    responseType\n    extractorExpression\n    conditionOperator\n    expectedValue\n    scheduleExpression\n    createdAt\n    updatedAt\n  }\n}\n\nmutation DeleteWatch($id: ID!) {\n  deleteWatch(id: $id)\n}\n\nquery WatchRuns($watchId: ID!) {\n  watchRuns(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}\n\nmutation RunWatch($watchId: ID!) {\n  runWatch(watchId: $watchId) {\n    id\n    watchId\n    startedAt\n    completedAt\n    status\n    extractedValue\n    conditionMet\n    error\n  }\n}"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;