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
 * Represents a topic discovered in a model.
 *
 * @property {string} name
 *   Required. The resource name of the topic. Topic names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}/topics/{topic_id}`.
 *
 * @property {string[]} keywords
 *   A list of keywords to describe the topic. For now, the length of each
 *   keyword is limited to 128 bytes, and the total number of keywords is
 *   limited to 20.
 *
 * @property {string} description
 *   A human readable sentence/phrase to summarize the topic. For now, this is
 *   only set by cloud users. Length of the description is limited to 4096
 *   bytes.
 *
 * @typedef Topic
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.Topic definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/topic.proto}
 */
const Topic = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for ListTopics.
 *
 * @property {string} parent
 *   The name of the model whose topics we'd like to list. Model names have
 *   the form `projects/{project_id}/locations/{location_id}/models/{model_id}`.
 *
 * @property {number} pageSize
 *   Requested page size. Server may return fewer topics than requested.
 *   If unspecified, server will pick an appropriate default.
 *
 * @property {string} pageToken
 *   A token identifying a page of results the server should return. Typically,
 *   this is the value of [ListTopicsResponse.next_page_token] returned from the
 *   previous call to `ListTopics` method.
 *
 * @typedef ListTopicsRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ListTopicsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/topic.proto}
 */
const ListTopicsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The response message for ListTopics.
 *
 * @property {Object[]} topics
 *   The list of topics.
 *
 *   This object should have the same structure as [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}
 *
 * @property {string} nextPageToken
 *   A token to retrieve next page of results. Pass this value in the
 *   [ListTopicsRequest.page_token] field in the subsequent call to `ListTopics`
 *   method to retrieve the next page of results.
 *
 * @typedef ListTopicsResponse
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ListTopicsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/topic.proto}
 */
const ListTopicsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for GetTopic.
 *
 * @property {string} name
 *   The name of topic to retrieve. Topic names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}/topics/{topic_id}`.
 *
 * @typedef GetTopicRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.GetTopicRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/topic.proto}
 */
const GetTopicRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * The request message for UpdateTopic.
 *
 * @property {Object} topic
 *   The topic that updates the resource in the server. The fields `name` and
 *   `keywords` must be empty and field `description` must specify new value of
 *   description.
 *
 *   This object should have the same structure as [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}
 *
 * @property {Object} updateMask
 *   Only updates the fields indicated by this mask.
 *   The field mask must not be empty, and it must not contain fields that
 *   are immutable or only set by the server.
 *   For now, mutable field is only `description`.
 *
 *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
 *
 * @typedef UpdateTopicRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.UpdateTopicRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/topic.proto}
 */
const UpdateTopicRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};