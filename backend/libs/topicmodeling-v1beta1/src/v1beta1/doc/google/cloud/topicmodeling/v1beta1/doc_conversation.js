// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Note: this file is purely for documentation. Any contents are not expected
// to be loaded as the JS file.

/**
 * Represents a conversation used in a model training.
 *
 * @property {string} name
 *   Required. The resource name of the conversation. Conversation names have
 *   the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}/conversations/{conversation_id}`.
 *
 * @property {string} gcsUri
 *   The URI of Cloud Storage location to store the conversation file, for
 *   example, "gs://bucket_id/dir1/file1".
 *
 * @property {string} topic
 *   The resource name of topic that the conversation mainly talks about.
 *
 * @typedef Conversation
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.Conversation definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/conversation.proto}
 */
const Conversation = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for ListConversations.
 *
 * @property {string} parent
 *   The name of the model whose input conversations we'd like to list. Model
 *   names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
 *
 * @property {number} pageSize
 *   Requested page size. Server may return fewer conversations than requested.
 *   If unspecified, server will pick an appropriate default.
 *
 * @property {string} pageToken
 *   A token identifying a page of results the server should return. Typically,
 *   this is the value of [ListConversationsResponse.next_page_token] returned
 *   from the previous call to `ListConversations` method.
 *
 * @property {string} filter
 *   Filter specifying constraints of a list operation.
 *   For example,
 *   `topic="projects/{project_id}/locations/{location_id}/models/{model_id}/topics/{topic_id}"`.
 *
 * @typedef ListConversationsRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ListConversationsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/conversation.proto}
 */
const ListConversationsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response message for ListConversations.
 *
 * @property {Object[]} conversations
 *   The list of conversations.
 *
 *   This object should have the same structure as [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}
 *
 * @property {string} nextPageToken
 *   A token to retrieve next page of results. Pass this value in the
 *   [ListConversationsRequest.page_token] field in the subsequent call to
 *   `ListConversations` method to retrieve the next page of results.
 *
 * @typedef ListConversationsResponse
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ListConversationsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/conversation.proto}
 */
const ListConversationsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for GetConversation.
 *
 * @property {string} name
 *   The name of conversation to retrieve. Conversation names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}/conversations/{conversation_id}`.
 *
 * @property {string} gcsUri
 *   The URI of Cloud Storage location of the conversation file, for example,
 *   "gs://bucket_id/dir1/file1".
 *
 * @typedef GetConversationRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.GetConversationRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/conversation.proto}
 */
const GetConversationRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for UpdateConversation.
 *
 * @property {Object} conversation
 *   The conversation that updates the resource in the server. The field `name`
 *   is required and field `topic` must specify new value of topic name.
 *
 *   This object should have the same structure as [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}
 *
 * @property {Object} updateMask
 *   Only updates the fields indicated by this mask.
 *   The field mask must not be empty, and it must not contain fields that
 *   are immutable or only set by the server.
 *   For now, mutable field is only `topic`.
 *
 *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
 *
 * @typedef UpdateConversationRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.UpdateConversationRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/conversation.proto}
 */
const UpdateConversationRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};