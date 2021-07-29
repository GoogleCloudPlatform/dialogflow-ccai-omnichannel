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
 * Cloud Storage location for the input content.
 *
 * @property {string[]} uris
 *   Cloud Storage paths to files e.g., gs://my_bucket//agent*.flv.
 *   Wildcards are allowed and will be expanded into all matched files. File
 *   format is determined based on file name extensions. API returns
 *   [google.rpc.Code.INVALID_ARGUMENT] for unsupported URI-s and file formats.
 *
 * @typedef GcsSource
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.GcsSource definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const GcsSource = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * InputConfig contains a set of files in Cloud Storage for model
 * training.
 *
 * @property {string} name
 *   Name of this input config. Can be used when summarizing model performance.
 *
 * @property {Object} gcsSource
 *   Cloud Storage location where input content is located.
 *
 *   This object should have the same structure as [GcsSource]{@link google.cloud.topicmodeling.v1beta1.GcsSource}
 *
 * @property {number} type
 *   Required. If the type is not set or is `TYPE_UNSPECIFIED`,
 *   returns an `INVALID_ARGUMENT` error.
 *
 *   The number should be among the values of [Type]{@link google.cloud.topicmodeling.v1beta1.Type}
 *
 * @typedef InputConfig
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.InputConfig definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const InputConfig = {
  // This is for documentation. Actual contents will be loaded by gRPC.

  /**
   * The input content types enum.
   *
   * @enum {number}
   * @memberof google.cloud.topicmodeling.v1beta1
   */
  Type: {

    /**
     * The content type is not specified.
     */
    TYPE_UNSPECIFIED: 0,

    /**
     * Text data.
     */
    TEXT: 2
  }
};

/**
 * Cloud Storage location for the output content.
 *
 * @property {string} uriPrefix
 *   URI for a Cloud Storage directory where final topic modeling results
 *   like topics and topic assignment for input data items, and other meta
 *   information should be written to (e.g.,
 *   "gs://bucket_id/path/to/destination/dir"). If there is no trailing slash,
 *   the service will append one when composing the object path.
 *
 * @typedef GcsDestination
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.GcsDestination definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const GcsDestination = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * OutputConfig contains Cloud Storage location for output content.
 *
 * @property {Object} gcsDestination
 *   Cloud Storage location where the outputs are written to.
 *
 *   This object should have the same structure as [GcsDestination]{@link google.cloud.topicmodeling.v1beta1.GcsDestination}
 *
 * @typedef OutputConfig
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.OutputConfig definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const OutputConfig = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Flags used for model training.
 *
 * @property {number} desiredTopicCount
 *   Required. The number of topics will be generated in the model training.
 *   This is input argument of model training.
 *
 * @typedef ModelTrainingFlags
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ModelTrainingFlags definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const ModelTrainingFlags = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Represents a model trained on user supplied data.
 *
 * @property {string} name
 *   Required. The resource name of the model. Model names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
 *
 * @property {Object} trainingInputConfig
 *   Required. Provides training data location.
 *
 *   This object should have the same structure as [InputConfig]{@link google.cloud.topicmodeling.v1beta1.InputConfig}
 *
 * @property {Object} modelTrainingFlags
 *   Required. Used to specify the number of topics to be discovered during
 *   model training.
 *
 *   This object should have the same structure as [ModelTrainingFlags]{@link google.cloud.topicmodeling.v1beta1.ModelTrainingFlags}
 *
 * @property {Object} createTime
 *   Output only. Time CreateModel was called.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} processingStartTime
 *   Output only. When the topic modeling pipeline was started.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} processingEndTime
 *   Output only. When the topic modeling pipeline was finished.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @typedef Model
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.Model definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const Model = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Stored in the LRO.metadata field returned by CreateModel.
 *
 * @property {number} state
 *   The current state of the training operation.
 *
 *   The number should be among the values of [State]{@link google.cloud.topicmodeling.v1beta1.State}
 *
 * @property {Object} startTime
 *   The time when the batch request was submitted to the server.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {Object} endTime
 *   The time when the batch request is finished and
 *   google.longrunning.Operation.done is set to true.
 *
 *   This object should have the same structure as [Timestamp]{@link google.protobuf.Timestamp}
 *
 * @property {number} progressPercent
 *   Progress of operation. Range: [0, 100].
 *
 * @typedef ModelCreationOperationMetadata
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ModelCreationOperationMetadata definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const ModelCreationOperationMetadata = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Request message for CreateModel.
 *
 * @property {string} parent
 *   Required. Project names have the form
 *   `projects/{project_id}/locations/{location_id}`.
 *
 * @property {Object} model
 *   The model to create.
 *
 *   This object should have the same structure as [Model]{@link google.cloud.topicmodeling.v1beta1.Model}
 *
 * @typedef CreateModelRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.CreateModelRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const CreateModelRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Request message for ListModels.
 *
 * @property {string} parent
 *   The name of the project whose models we'd like to list. Project names
 *   have the form `projects/{project_id}/locations/{location_id}`.
 *
 * @property {number} pageSize
 *   Requested page size. Server may return fewer models than requested.
 *   If unspecified, server will pick an appropriate default.
 *
 * @property {string} pageToken
 *   A token identifying a page of results the server should return. Typically,
 *   this is the value of [ListModelsResponse.next_page_token] returned from the
 *   previous call to `ListModels` method.
 *
 * @typedef ListModelsRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ListModelsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const ListModelsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Response message for ListModels.
 *
 * @property {Object[]} models
 *   The list of models.
 *
 *   This object should have the same structure as [Model]{@link google.cloud.topicmodeling.v1beta1.Model}
 *
 * @property {string} nextPageToken
 *   A token to retrieve next page of results. Pass this value in the
 *   [ListModelsRequest.page_token] field in the subsequent call to `ListModels`
 *   method to retrieve the next page of results.
 *
 * @typedef ListModelsResponse
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ListModelsResponse definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const ListModelsResponse = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Request message for GetModel.
 *
 * @property {string} name
 *   The name of the model to retrieve. Model names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
 *
 * @typedef GetModelRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.GetModelRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const GetModelRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Request message for DeleteModel. All output data associated with model are
 * deleted as well.
 *
 * @property {string} name
 *   The name of the model to delete. Model names have the form
 *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
 *
 * @typedef DeleteModelRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.DeleteModelRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const DeleteModelRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Request message for ExportModelingResults.
 *
 * @property {string} name
 *   The name of the model to export resulting data. Model names have the
 *   form `projects/{project_id}/locations/{location_id}/models/{model_id}`.
 *
 * @property {Object} outputConfig
 *   Required. Provides output location.
 *
 *   This object should have the same structure as [OutputConfig]{@link google.cloud.topicmodeling.v1beta1.OutputConfig}
 *
 * @typedef ExportModelResultsRequest
 * @memberof google.cloud.topicmodeling.v1beta1
 * @see [google.cloud.topicmodeling.v1beta1.ExportModelResultsRequest definition in proto format]{@link https://github.com/googleapis/googleapis/blob/master/google/cloud/topicmodeling/v1beta1/model.proto}
 */
const ExportModelResultsRequest = {
  // This is for documentation. Actual contents will be loaded by gRPC.
};

/**
 * Enumerates the possible states that the creation request can be in.
 *
 * @enum {number}
 * @memberof google.cloud.topicmodeling.v1beta1
 */
const State = {

  /**
   * Invalid.
   */
  STATE_UNSPECIFIED: 0,

  /**
   * Request is submitted, but initialization or training is not started yet.
   * May remain in this state until there is enough capacity to start
   * training.
   */
  SUBMITTED: 1,

  /**
   * Request is being prepared for distributed processing.
   */
  INITIALIZING: 2,

  /**
   * Custom model is training.
   */
  TRAINING: 3,

  /**
   * Model is in the process of being deleted (or cancelled if creation did
   * not complete). This is the expected state immediately after the user
   * called DeleteModel on the model name.
   */
  DELETING: 4,

  /**
   * The model has been created.
   */
  SUCCEEDED: 5,

  /**
   * The model could not be created.
   */
  FAILED: 6,

  /**
   * Deleted.
   */
  DELETED: 7
};