/* eslint-disable */
/** Internal type. DO NOT USE DIRECTLY. */
type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
/** Internal type. DO NOT USE DIRECTLY. */
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type ConditionOperator =
  | 'CHANGED'
  | 'EQUALS'
  | 'GREATER_THAN'
  | 'LESS_THAN';

export type CreateWatchInput = {
  conditionOperator: ConditionOperator;
  expectedValue?: string | null | undefined;
  extractorExpression: string;
  name: string;
  responseType: ResponseType;
  scheduleExpression: string;
  targetUrl: string;
};

export type ResponseType =
  | 'HTML'
  | 'JSON';

export type RunStatus =
  | 'ERROR'
  | 'FAIL'
  | 'PASS';

export type UpdateWatchInput = {
  conditionOperator?: ConditionOperator | null | undefined;
  expectedValue?: string | null | undefined;
  extractorExpression?: string | null | undefined;
  name?: string | null | undefined;
  responseType?: ResponseType | null | undefined;
  scheduleExpression?: string | null | undefined;
  targetUrl?: string | null | undefined;
};

export type WatchesQueryVariables = Exact<{ [key: string]: never; }>;


export type WatchesQuery = { watches: Array<{ id: string, name: string, targetUrl: string, responseType: ResponseType, extractorExpression: string, conditionOperator: ConditionOperator, expectedValue: string | null, scheduleExpression: string, createdAt: string, updatedAt: string }> };

export type WatchQueryVariables = Exact<{
  id: string | number;
}>;


export type WatchQuery = { watch: { id: string, name: string, targetUrl: string, responseType: ResponseType, extractorExpression: string, conditionOperator: ConditionOperator, expectedValue: string | null, scheduleExpression: string, createdAt: string, updatedAt: string } | null };

export type CreateWatchMutationVariables = Exact<{
  input: CreateWatchInput;
}>;


export type CreateWatchMutation = { createWatch: { id: string, name: string, targetUrl: string, responseType: ResponseType, extractorExpression: string, conditionOperator: ConditionOperator, expectedValue: string | null, scheduleExpression: string, createdAt: string, updatedAt: string } };

export type UpdateWatchMutationVariables = Exact<{
  id: string | number;
  input: UpdateWatchInput;
}>;


export type UpdateWatchMutation = { updateWatch: { id: string, name: string, targetUrl: string, responseType: ResponseType, extractorExpression: string, conditionOperator: ConditionOperator, expectedValue: string | null, scheduleExpression: string, createdAt: string, updatedAt: string } };

export type DeleteWatchMutationVariables = Exact<{
  id: string | number;
}>;


export type DeleteWatchMutation = { deleteWatch: string };

export type WatchRunsQueryVariables = Exact<{
  watchId: string | number;
}>;


export type WatchRunsQuery = { watchRuns: Array<{ id: string, watchId: string, startedAt: string, completedAt: string, status: RunStatus, extractedValue: string | null, conditionMet: boolean | null, error: string | null }> };

export type RunWatchMutationVariables = Exact<{
  watchId: string | number;
}>;


export type RunWatchMutation = { runWatch: { id: string, watchId: string, startedAt: string, completedAt: string, status: RunStatus, extractedValue: string | null, conditionMet: boolean | null, error: string | null } };


export const WatchesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Watches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"watches"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetUrl"}},{"kind":"Field","name":{"kind":"Name","value":"responseType"}},{"kind":"Field","name":{"kind":"Name","value":"extractorExpression"}},{"kind":"Field","name":{"kind":"Name","value":"conditionOperator"}},{"kind":"Field","name":{"kind":"Name","value":"expectedValue"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleExpression"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WatchesQuery, WatchesQueryVariables>;
export const WatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Watch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"watch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetUrl"}},{"kind":"Field","name":{"kind":"Name","value":"responseType"}},{"kind":"Field","name":{"kind":"Name","value":"extractorExpression"}},{"kind":"Field","name":{"kind":"Name","value":"conditionOperator"}},{"kind":"Field","name":{"kind":"Name","value":"expectedValue"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleExpression"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<WatchQuery, WatchQueryVariables>;
export const CreateWatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateWatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateWatchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createWatch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetUrl"}},{"kind":"Field","name":{"kind":"Name","value":"responseType"}},{"kind":"Field","name":{"kind":"Name","value":"extractorExpression"}},{"kind":"Field","name":{"kind":"Name","value":"conditionOperator"}},{"kind":"Field","name":{"kind":"Name","value":"expectedValue"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleExpression"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateWatchMutation, CreateWatchMutationVariables>;
export const UpdateWatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateWatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateWatchInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateWatch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"input"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"targetUrl"}},{"kind":"Field","name":{"kind":"Name","value":"responseType"}},{"kind":"Field","name":{"kind":"Name","value":"extractorExpression"}},{"kind":"Field","name":{"kind":"Name","value":"conditionOperator"}},{"kind":"Field","name":{"kind":"Name","value":"expectedValue"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleExpression"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateWatchMutation, UpdateWatchMutationVariables>;
export const DeleteWatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteWatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteWatch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeleteWatchMutation, DeleteWatchMutationVariables>;
export const WatchRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"WatchRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"watchId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"watchRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"watchId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"watchId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"watchId"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"extractedValue"}},{"kind":"Field","name":{"kind":"Name","value":"conditionMet"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<WatchRunsQuery, WatchRunsQueryVariables>;
export const RunWatchDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RunWatch"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"watchId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"runWatch"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"watchId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"watchId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"watchId"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"completedAt"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"extractedValue"}},{"kind":"Field","name":{"kind":"Name","value":"conditionMet"}},{"kind":"Field","name":{"kind":"Name","value":"error"}}]}}]}}]} as unknown as DocumentNode<RunWatchMutation, RunWatchMutationVariables>;