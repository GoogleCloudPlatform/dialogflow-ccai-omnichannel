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

'use strict';

const gapicConfig = require('./topic_modeling_service_client_config');
const gax = require('google-gax');
const merge = require('lodash.merge');
const path = require('path');
const protobuf = require('protobufjs');

const VERSION = require('../../package.json').version;

/**
 * Service for performing topic modeling operations.
 *
 * @class
 * @memberof v1beta1
 */
class TopicModelingServiceClient {
  /**
   * Construct an instance of TopicModelingServiceClient.
   *
   * @param {object} [options] - The configuration object. See the subsequent
   *   parameters for more details.
   * @param {object} [options.credentials] - Credentials object.
   * @param {string} [options.credentials.client_email]
   * @param {string} [options.credentials.private_key]
   * @param {string} [options.email] - Account email address. Required when
   *     using a .pem or .p12 keyFilename.
   * @param {string} [options.keyFilename] - Full path to the a .json, .pem, or
   *     .p12 key downloaded from the Google Developers Console. If you provide
   *     a path to a JSON file, the projectId option below is not necessary.
   *     NOTE: .pem and .p12 require you to specify options.email as well.
   * @param {number} [options.port] - The port on which to connect to
   *     the remote host.
   * @param {string} [options.projectId] - The project ID from the Google
   *     Developer's Console, e.g. 'grape-spaceship-123'. We will also check
   *     the environment variable GCLOUD_PROJECT for your project ID. If your
   *     app is running in an environment which supports
   *     {@link https://developers.google.com/identity/protocols/application-default-credentials Application Default Credentials},
   *     your project ID will be detected automatically.
   * @param {function} [options.promise] - Custom promise module to use instead
   *     of native Promises.
   * @param {string} [options.servicePath] - The domain name of the
   *     API remote host.
   */
  constructor(opts) {
    this._descriptors = {};

    // Ensure that options include the service address and port.
    opts = Object.assign(
      {
        clientConfig: {},
        port: this.constructor.port,
        servicePath: this.constructor.servicePath,
      },
      opts
    );

    // Create a `gaxGrpc` object, with any grpc-specific options
    // sent to the client.
    opts.scopes = this.constructor.scopes;
    const gaxGrpc = new gax.GrpcClient(opts);

    // Save the auth object to the client, for use by other methods.
    this.auth = gaxGrpc.auth;

    // Determine the client header string.
    const clientHeader = [
      `gl-node/${process.version}`,
      `grpc/${gaxGrpc.grpcVersion}`,
      `gax/${gax.version}`,
      `gapic/${VERSION}`,
    ];
    if (opts.libName && opts.libVersion) {
      clientHeader.push(`${opts.libName}/${opts.libVersion}`);
    }

    // Load the applicable protos.
    const protos = merge(
      {},
      gaxGrpc.loadProto(
        path.join(__dirname, '..', '..', 'protos'),
        'google/cloud/topicmodeling/v1beta1/topic_modeling_service.proto'
      )
    );

    // This API contains "path templates"; forward-slash-separated
    // identifiers to uniquely identify resources within the API.
    // Create useful helper objects for these.
    this._pathTemplates = {
      locationPathTemplate: new gax.PathTemplate(
        'projects/{project}/locations/{location}'
      ),
      modelPathTemplate: new gax.PathTemplate(
        'projects/{project}/locations/{location}/models/{model}'
      ),
      conversationPathTemplate: new gax.PathTemplate(
        'projects/{project}/locations/{location}/models/{model}/conversations/{conversation}'
      ),
      topicPathTemplate: new gax.PathTemplate(
        'projects/{project}/locations/{location}/models/{model}/topics/{topic}'
      ),
    };

    // Some of the methods on this service return "paged" results,
    // (e.g. 50 results at a time, with tokens to get subsequent
    // pages). Denote the keys used for pagination and results.
    this._descriptors.page = {
      listModels: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'models'
      ),
      listTopics: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'topics'
      ),
      listConversations: new gax.PageDescriptor(
        'pageToken',
        'nextPageToken',
        'conversations'
      ),
    };
    let protoFilesRoot = new gax.GoogleProtoFilesRoot();
    protoFilesRoot = protobuf.loadSync(
      path.join(__dirname, '..', '..', 'protos', 'google/cloud/topicmodeling/v1beta1/topic_modeling_service.proto'),
      protoFilesRoot
    );


    // This API contains "long-running operations", which return a
    // an Operation object that allows for tracking of the operation,
    // rather than holding a request open.
    this.operationsClient = new gax.lro({
      auth: gaxGrpc.auth,
      grpc: gaxGrpc.grpc,
    }).operationsClient(opts);

    const createModelResponse = protoFilesRoot.lookup(
      'google.longrunning.Operation'
    );
    const createModelMetadata = protoFilesRoot.lookup(
      'google.cloud.topicmodeling.v1beta1.ModelCreationOperationMetadata'
    );
    const exportModelResultsResponse = protoFilesRoot.lookup(
      'google.longrunning.Operation'
    );
    const exportModelResultsMetadata = protoFilesRoot.lookup(
      'google.protobuf.Any'
    );

    this._descriptors.longrunning = {
      createModel: new gax.LongrunningDescriptor(
        this.operationsClient,
        createModelResponse.decode.bind(createModelResponse),
        createModelMetadata.decode.bind(createModelMetadata)
      ),
      exportModelResults: new gax.LongrunningDescriptor(
        this.operationsClient,
        exportModelResultsResponse.decode.bind(exportModelResultsResponse),
        exportModelResultsMetadata.decode.bind(exportModelResultsMetadata)
      ),
    };

    // Put together the default options sent with requests.
    const defaults = gaxGrpc.constructSettings(
      'google.cloud.topicmodeling.v1beta1.TopicModelingService',
      gapicConfig,
      opts.clientConfig,
      {'x-goog-api-client': clientHeader.join(' ')}
    );

    // Set up a dictionary of "inner API calls"; the core implementation
    // of calling the API is handled in `google-gax`, with this code
    // merely providing the destination and request information.
    this._innerApiCalls = {};

    // Put together the "service stub" for
    // google.cloud.topicmodeling.v1beta1.TopicModelingService.
    const topicModelingServiceStub = gaxGrpc.createStub(
      protos.google.cloud.topicmodeling.v1beta1.TopicModelingService,
      opts
    );

    // Iterate over each of the methods that the service provides
    // and create an API call method for each.
    const topicModelingServiceStubMethods = [
      'createModel',
      'listModels',
      'getModel',
      'deleteModel',
      'exportModelResults',
      'listTopics',
      'getTopic',
      'updateTopic',
      'listConversations',
      'getConversation',
      'updateConversation',
    ];
    for (const methodName of topicModelingServiceStubMethods) {
      this._innerApiCalls[methodName] = gax.createApiCall(
        topicModelingServiceStub.then(
          stub =>
            function() {
              const args = Array.prototype.slice.call(arguments, 0);
              return stub[methodName].apply(stub, args);
            },
          err =>
            function() {
              throw err;
            }
        ),
        defaults[methodName],
        this._descriptors.page[methodName] || this._descriptors.longrunning[methodName]
      );
    }
  }

  /**
   * The DNS address for this API service.
   */
  static get servicePath() {
    return 'topicmodeling.googleapis.com';
  }

  /**
   * The port for this API service.
   */
  static get port() {
    return 443;
  }

  /**
   * The scopes needed to make gRPC calls for every method defined
   * in this service.
   */
  static get scopes() {
    return [
      'https://www.googleapis.com/auth/cloud-platform',
    ];
  }

  /**
   * Return the project ID used by this class.
   * @param {function(Error, string)} callback - the callback to
   *   be called with the current project Id.
   */
  getProjectId(callback) {
    return this.auth.getProjectId(callback);
  }

  // -------------------
  // -- Service calls --
  // -------------------

  /**
   * Creates a custom topic model, and returns the long running operation.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   Required. Project names have the form
   *   `projects/{project_id}/locations/{location_id}`.
   * @param {Object} request.model
   *   The model to create.
   *
   *   This object should have the same structure as [Model]{@link google.cloud.topicmodeling.v1beta1.Model}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
   * const model = {};
   * const request = {
   *   parent: formattedParent,
   *   model: model,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.createModel(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
   *
   *     // Operation#promise starts polling for the completion of the LRO.
   *     return operation.promise();
   *   })
   *   .then(responses => {
   *     const result = responses[0];
   *     const metadata = responses[1];
   *     const finalApiResponse = responses[2];
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
   * const model = {};
   * const request = {
   *   parent: formattedParent,
   *   model: model,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.createModel(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
   *
   *     // Adding a listener for the "complete" event starts polling for the
   *     // completion of the operation.
   *     operation.on('complete', (result, metadata, finalApiResponse) => {
   *       // doSomethingWith(result);
   *     });
   *
   *     // Adding a listener for the "progress" event causes the callback to be
   *     // called on any change in metadata when the operation is polled.
   *     operation.on('progress', (metadata, apiResponse) => {
   *       // doSomethingWith(metadata)
   *     });
   *
   *     // Adding a listener for the "error" event handles any errors found during polling.
   *     operation.on('error', err => {
   *       // throw(err);
   *     });
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  createModel(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.createModel(request, options, callback);
  }

  /**
   * Lists models in the project. The order is unspecified but deterministic.
   * Newly created models will not necessarily be added tos the end of this
   * list. Returns NOT_FOUND if the projects does not exist.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   The name of the project whose models we'd like to list. Project names
   *   have the form `projects/{project_id}/locations/{location_id}`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Model]{@link google.cloud.topicmodeling.v1beta1.Model}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListModelsResponse]{@link google.cloud.topicmodeling.v1beta1.ListModelsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Model]{@link google.cloud.topicmodeling.v1beta1.Model}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Model]{@link google.cloud.topicmodeling.v1beta1.Model} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListModelsResponse]{@link google.cloud.topicmodeling.v1beta1.ListModelsResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
   *
   * client.listModels({parent: formattedParent})
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (const resource of resources) {
   *       // doThingsWith(resource)
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (const resource of resources) {
   *     // doThingsWith(resource);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listModels(nextRequest, options).then(callback);
   *   }
   * }
   * client.listModels({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listModels(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listModels(request, options, callback);
  }

  /**
   * Equivalent to {@link listModels}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listModels} continuously
   * and invokes the callback registered for 'data' event for each element in the
   * responses.
   *
   * The returned object has 'end' method when no more elements are required.
   *
   * autoPaginate option will be ignored.
   *
   * @see {@link https://nodejs.org/api/stream.html}
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   The name of the project whose models we'd like to list. Project names
   *   have the form `projects/{project_id}/locations/{location_id}`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Model]{@link google.cloud.topicmodeling.v1beta1.Model} on 'data' event.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
   * client.listModelsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listModelsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listModels.createStream(
      this._innerApiCalls.listModels,
      request,
      options
    );
  };

  /**
   * Gets a model. Returns NOT_FOUND if the model does not exist.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The name of the model to retrieve. Model names have the form
   *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Model]{@link google.cloud.topicmodeling.v1beta1.Model}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Model]{@link google.cloud.topicmodeling.v1beta1.Model}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * client.getModel({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getModel(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getModel(request, options, callback);
  }

  /**
   * Deletes a model, or cancels training if the model isn't created yet.
   * Returns NOT_FOUND if the model name doesn't exist.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The name of the model to delete. Model names have the form
   *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error)} [callback]
   *   The function which will be called with the result of the API call.
   * @returns {Promise} - The promise which resolves when API call finishes.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * client.deleteModel({name: formattedName}).catch(err => {
   *   console.error(err);
   * });
   */
  deleteModel(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.deleteModel(request, options, callback);
  }

  /**
   * Exports topic modeling results by dumping topics metadata and topic
   * assignment of input data to Google cloud storage location, and returns the
   * long running operation.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The name of the model to export resulting data. Model names have the
   *   form `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {Object} request.outputConfig
   *   Required. Provides output location.
   *
   *   This object should have the same structure as [OutputConfig]{@link google.cloud.topicmodeling.v1beta1.OutputConfig}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is a [gax.Operation]{@link https://googleapis.github.io/gax-nodejs/Operation} object.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * const outputConfig = {};
   * const request = {
   *   name: formattedName,
   *   outputConfig: outputConfig,
   * };
   *
   * // Handle the operation using the promise pattern.
   * client.exportModelResults(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
   *
   *     // Operation#promise starts polling for the completion of the LRO.
   *     return operation.promise();
   *   })
   *   .then(responses => {
   *     const result = responses[0];
   *     const metadata = responses[1];
   *     const finalApiResponse = responses[2];
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * const outputConfig = {};
   * const request = {
   *   name: formattedName,
   *   outputConfig: outputConfig,
   * };
   *
   * // Handle the operation using the event emitter pattern.
   * client.exportModelResults(request)
   *   .then(responses => {
   *     const [operation, initialApiResponse] = responses;
   *
   *     // Adding a listener for the "complete" event starts polling for the
   *     // completion of the operation.
   *     operation.on('complete', (result, metadata, finalApiResponse) => {
   *       // doSomethingWith(result);
   *     });
   *
   *     // Adding a listener for the "progress" event causes the callback to be
   *     // called on any change in metadata when the operation is polled.
   *     operation.on('progress', (metadata, apiResponse) => {
   *       // doSomethingWith(metadata)
   *     });
   *
   *     // Adding a listener for the "error" event handles any errors found during polling.
   *     operation.on('error', err => {
   *       // throw(err);
   *     });
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  exportModelResults(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.exportModelResults(request, options, callback);
  }

  /**
   * Lists topics in a model.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   The name of the model whose topics we'd like to list. Model names have
   *   the form `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListTopicsResponse]{@link google.cloud.topicmodeling.v1beta1.ListTopicsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListTopicsResponse]{@link google.cloud.topicmodeling.v1beta1.ListTopicsResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   *
   * client.listTopics({parent: formattedParent})
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (const resource of resources) {
   *       // doThingsWith(resource)
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (const resource of resources) {
   *     // doThingsWith(resource);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listTopics(nextRequest, options).then(callback);
   *   }
   * }
   * client.listTopics({parent: formattedParent}, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listTopics(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listTopics(request, options, callback);
  }

  /**
   * Equivalent to {@link listTopics}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listTopics} continuously
   * and invokes the callback registered for 'data' event for each element in the
   * responses.
   *
   * The returned object has 'end' method when no more elements are required.
   *
   * autoPaginate option will be ignored.
   *
   * @see {@link https://nodejs.org/api/stream.html}
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   The name of the model whose topics we'd like to list. Model names have
   *   the form `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic} on 'data' event.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * client.listTopicsStream({parent: formattedParent})
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listTopicsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listTopics.createStream(
      this._innerApiCalls.listTopics,
      request,
      options
    );
  };

  /**
   * Gets a topic. Returns NOT_FOUND if the topic does not exist.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The name of topic to retrieve. Topic names have the form
   *   `projects/{project_id}/locations/{location_id}/models/{model_id}/topics/{topic_id}`.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.topicPath('[PROJECT]', '[LOCATION]', '[MODEL]', '[TOPIC]');
   * client.getTopic({name: formattedName})
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getTopic(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getTopic(request, options, callback);
  }

  /**
   * Updates the description of a topic. Returns NOT_FOUND if the topic does not
   * exist. If a topic description does not exist, new topic description is set.
   * Otherwise, existing topic description will be updated.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {Object} request.topic
   *   The topic that updates the resource in the server. The fields `name` and
   *   `keywords` must be empty and field `description` must specify new value of
   *   description.
   *
   *   This object should have the same structure as [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}
   * @param {Object} request.updateMask
   *   Only updates the fields indicated by this mask.
   *   The field mask must not be empty, and it must not contain fields that
   *   are immutable or only set by the server.
   *   For now, mutable field is only `description`.
   *
   *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Topic]{@link google.cloud.topicmodeling.v1beta1.Topic}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const topic = {};
   * const updateMask = {};
   * const request = {
   *   topic: topic,
   *   updateMask: updateMask,
   * };
   * client.updateTopic(request)
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  updateTopic(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.updateTopic(request, options, callback);
  }

  /**
   * Lists conversations used in model training.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   The name of the model whose input conversations we'd like to list. Model
   *   names have the form
   *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {string} request.filter
   *   Filter specifying constraints of a list operation.
   *   For example,
   *   `topic="projects/{project_id}/locations/{location_id}/models/{model_id}/topics/{topic_id}"`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Array, ?Object, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is Array of [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}.
   *
   *   When autoPaginate: false is specified through options, it contains the result
   *   in a single response. If the response indicates the next page exists, the third
   *   parameter is set to be used for the next request object. The fourth parameter keeps
   *   the raw response object of an object representing [ListConversationsResponse]{@link google.cloud.topicmodeling.v1beta1.ListConversationsResponse}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is Array of [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}.
   *
   *   When autoPaginate: false is specified through options, the array has three elements.
   *   The first element is Array of [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation} in a single response.
   *   The second element is the next request object if the response
   *   indicates the next page exists, or null. The third element is
   *   an object representing [ListConversationsResponse]{@link google.cloud.topicmodeling.v1beta1.ListConversationsResponse}.
   *
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * // Iterate over all elements.
   * const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * const filter = '';
   * const request = {
   *   parent: formattedParent,
   *   filter: filter,
   * };
   *
   * client.listConversations(request)
   *   .then(responses => {
   *     const resources = responses[0];
   *     for (const resource of resources) {
   *       // doThingsWith(resource)
   *     }
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   *
   * // Or obtain the paged response.
   * const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * const filter = '';
   * const request = {
   *   parent: formattedParent,
   *   filter: filter,
   * };
   *
   *
   * const options = {autoPaginate: false};
   * const callback = responses => {
   *   // The actual resources in a response.
   *   const resources = responses[0];
   *   // The next request if the response shows that there are more responses.
   *   const nextRequest = responses[1];
   *   // The actual response object, if necessary.
   *   // const rawResponse = responses[2];
   *   for (const resource of resources) {
   *     // doThingsWith(resource);
   *   }
   *   if (nextRequest) {
   *     // Fetch the next page.
   *     return client.listConversations(nextRequest, options).then(callback);
   *   }
   * }
   * client.listConversations(request, options)
   *   .then(callback)
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  listConversations(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.listConversations(request, options, callback);
  }

  /**
   * Equivalent to {@link listConversations}, but returns a NodeJS Stream object.
   *
   * This fetches the paged responses for {@link listConversations} continuously
   * and invokes the callback registered for 'data' event for each element in the
   * responses.
   *
   * The returned object has 'end' method when no more elements are required.
   *
   * autoPaginate option will be ignored.
   *
   * @see {@link https://nodejs.org/api/stream.html}
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.parent
   *   The name of the model whose input conversations we'd like to list. Model
   *   names have the form
   *   `projects/{project_id}/locations/{location_id}/models/{model_id}`.
   * @param {string} request.filter
   *   Filter specifying constraints of a list operation.
   *   For example,
   *   `topic="projects/{project_id}/locations/{location_id}/models/{model_id}/topics/{topic_id}"`.
   * @param {number} [request.pageSize]
   *   The maximum number of resources contained in the underlying API
   *   response. If page streaming is performed per-resource, this
   *   parameter does not affect the return value. If page streaming is
   *   performed per-page, this determines the maximum number of
   *   resources in a page.
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @returns {Stream}
   *   An object stream which emits an object representing [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation} on 'data' event.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
   * const filter = '';
   * const request = {
   *   parent: formattedParent,
   *   filter: filter,
   * };
   * client.listConversationsStream(request)
   *   .on('data', element => {
   *     // doThingsWith(element)
   *   }).on('error', err => {
   *     console.log(err);
   *   });
   */
  listConversationsStream(request, options) {
    options = options || {};

    return this._descriptors.page.listConversations.createStream(
      this._innerApiCalls.listConversations,
      request,
      options
    );
  };

  /**
   * Gets a conversation. Returns NOT_FOUND if the conversation does not exist.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {string} request.name
   *   The name of conversation to retrieve. Conversation names have the form
   *   `projects/{project_id}/locations/{location_id}/models/{model_id}/conversations/{conversation_id}`.
   * @param {string} request.gcsUri
   *   The URI of Cloud Storage location of the conversation file, for example,
   *   "gs://bucket_id/dir1/file1".
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const formattedName = client.conversationPath('[PROJECT]', '[LOCATION]', '[MODEL]', '[CONVERSATION]');
   * const gcsUri = '';
   * const request = {
   *   name: formattedName,
   *   gcsUri: gcsUri,
   * };
   * client.getConversation(request)
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  getConversation(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.getConversation(request, options, callback);
  }

  /**
   * Updates the topic assignment of conversation. Returns NOT_FOUND if the
   * conversation does not exist.
   *
   * @param {Object} request
   *   The request object that will be sent.
   * @param {Object} request.conversation
   *   The conversation that updates the resource in the server. The field `name`
   *   is required and field `topic` must specify new value of topic name.
   *
   *   This object should have the same structure as [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}
   * @param {Object} request.updateMask
   *   Only updates the fields indicated by this mask.
   *   The field mask must not be empty, and it must not contain fields that
   *   are immutable or only set by the server.
   *   For now, mutable field is only `topic`.
   *
   *   This object should have the same structure as [FieldMask]{@link google.protobuf.FieldMask}
   * @param {Object} [options]
   *   Optional parameters. You can override the default settings for this call, e.g, timeout,
   *   retries, paginations, etc. See [gax.CallOptions]{@link https://googleapis.github.io/gax-nodejs/global.html#CallOptions} for the details.
   * @param {function(?Error, ?Object)} [callback]
   *   The function which will be called with the result of the API call.
   *
   *   The second parameter to the callback is an object representing [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}.
   * @returns {Promise} - The promise which resolves to an array.
   *   The first element of the array is an object representing [Conversation]{@link google.cloud.topicmodeling.v1beta1.Conversation}.
   *   The promise has a method named "cancel" which cancels the ongoing API call.
   *
   * @example
   *
   * const topicmodeling = require('topicmodeling.v1beta1');
   *
   * const client = new topicmodeling.v1beta1.TopicModelingServiceClient({
   *   // optional auth parameters.
   * });
   *
   * const conversation = {};
   * const updateMask = {};
   * const request = {
   *   conversation: conversation,
   *   updateMask: updateMask,
   * };
   * client.updateConversation(request)
   *   .then(responses => {
   *     const response = responses[0];
   *     // doThingsWith(response)
   *   })
   *   .catch(err => {
   *     console.error(err);
   *   });
   */
  updateConversation(request, options, callback) {
    if (options instanceof Function && callback === undefined) {
      callback = options;
      options = {};
    }
    options = options || {};

    return this._innerApiCalls.updateConversation(request, options, callback);
  }

  // --------------------
  // -- Path templates --
  // --------------------

  /**
   * Return a fully-qualified location resource name string.
   *
   * @param {String} project
   * @param {String} location
   * @returns {String}
   */
  locationPath(project, location) {
    return this._pathTemplates.locationPathTemplate.render({
      project: project,
      location: location,
    });
  }

  /**
   * Return a fully-qualified model resource name string.
   *
   * @param {String} project
   * @param {String} location
   * @param {String} model
   * @returns {String}
   */
  modelPath(project, location, model) {
    return this._pathTemplates.modelPathTemplate.render({
      project: project,
      location: location,
      model: model,
    });
  }

  /**
   * Return a fully-qualified conversation resource name string.
   *
   * @param {String} project
   * @param {String} location
   * @param {String} model
   * @param {String} conversation
   * @returns {String}
   */
  conversationPath(project, location, model, conversation) {
    return this._pathTemplates.conversationPathTemplate.render({
      project: project,
      location: location,
      model: model,
      conversation: conversation,
    });
  }

  /**
   * Return a fully-qualified topic resource name string.
   *
   * @param {String} project
   * @param {String} location
   * @param {String} model
   * @param {String} topic
   * @returns {String}
   */
  topicPath(project, location, model, topic) {
    return this._pathTemplates.topicPathTemplate.render({
      project: project,
      location: location,
      model: model,
      topic: topic,
    });
  }

  /**
   * Parse the locationName from a location resource.
   *
   * @param {String} locationName
   *   A fully-qualified path representing a location resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromLocationName(locationName) {
    return this._pathTemplates.locationPathTemplate
      .match(locationName)
      .project;
  }

  /**
   * Parse the locationName from a location resource.
   *
   * @param {String} locationName
   *   A fully-qualified path representing a location resources.
   * @returns {String} - A string representing the location.
   */
  matchLocationFromLocationName(locationName) {
    return this._pathTemplates.locationPathTemplate
      .match(locationName)
      .location;
  }

  /**
   * Parse the modelName from a model resource.
   *
   * @param {String} modelName
   *   A fully-qualified path representing a model resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromModelName(modelName) {
    return this._pathTemplates.modelPathTemplate
      .match(modelName)
      .project;
  }

  /**
   * Parse the modelName from a model resource.
   *
   * @param {String} modelName
   *   A fully-qualified path representing a model resources.
   * @returns {String} - A string representing the location.
   */
  matchLocationFromModelName(modelName) {
    return this._pathTemplates.modelPathTemplate
      .match(modelName)
      .location;
  }

  /**
   * Parse the modelName from a model resource.
   *
   * @param {String} modelName
   *   A fully-qualified path representing a model resources.
   * @returns {String} - A string representing the model.
   */
  matchModelFromModelName(modelName) {
    return this._pathTemplates.modelPathTemplate
      .match(modelName)
      .model;
  }

  /**
   * Parse the conversationName from a conversation resource.
   *
   * @param {String} conversationName
   *   A fully-qualified path representing a conversation resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromConversationName(conversationName) {
    return this._pathTemplates.conversationPathTemplate
      .match(conversationName)
      .project;
  }

  /**
   * Parse the conversationName from a conversation resource.
   *
   * @param {String} conversationName
   *   A fully-qualified path representing a conversation resources.
   * @returns {String} - A string representing the location.
   */
  matchLocationFromConversationName(conversationName) {
    return this._pathTemplates.conversationPathTemplate
      .match(conversationName)
      .location;
  }

  /**
   * Parse the conversationName from a conversation resource.
   *
   * @param {String} conversationName
   *   A fully-qualified path representing a conversation resources.
   * @returns {String} - A string representing the model.
   */
  matchModelFromConversationName(conversationName) {
    return this._pathTemplates.conversationPathTemplate
      .match(conversationName)
      .model;
  }

  /**
   * Parse the conversationName from a conversation resource.
   *
   * @param {String} conversationName
   *   A fully-qualified path representing a conversation resources.
   * @returns {String} - A string representing the conversation.
   */
  matchConversationFromConversationName(conversationName) {
    return this._pathTemplates.conversationPathTemplate
      .match(conversationName)
      .conversation;
  }

  /**
   * Parse the topicName from a topic resource.
   *
   * @param {String} topicName
   *   A fully-qualified path representing a topic resources.
   * @returns {String} - A string representing the project.
   */
  matchProjectFromTopicName(topicName) {
    return this._pathTemplates.topicPathTemplate
      .match(topicName)
      .project;
  }

  /**
   * Parse the topicName from a topic resource.
   *
   * @param {String} topicName
   *   A fully-qualified path representing a topic resources.
   * @returns {String} - A string representing the location.
   */
  matchLocationFromTopicName(topicName) {
    return this._pathTemplates.topicPathTemplate
      .match(topicName)
      .location;
  }

  /**
   * Parse the topicName from a topic resource.
   *
   * @param {String} topicName
   *   A fully-qualified path representing a topic resources.
   * @returns {String} - A string representing the model.
   */
  matchModelFromTopicName(topicName) {
    return this._pathTemplates.topicPathTemplate
      .match(topicName)
      .model;
  }

  /**
   * Parse the topicName from a topic resource.
   *
   * @param {String} topicName
   *   A fully-qualified path representing a topic resources.
   * @returns {String} - A string representing the topic.
   */
  matchTopicFromTopicName(topicName) {
    return this._pathTemplates.topicPathTemplate
      .match(topicName)
      .topic;
  }
}


module.exports = TopicModelingServiceClient;
