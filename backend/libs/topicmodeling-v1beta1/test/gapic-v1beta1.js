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

const assert = require('assert');

const topicmodelingModule = require('../src');

const FAKE_STATUS_CODE = 1;
const error = new Error();
error.code = FAKE_STATUS_CODE;

describe('TopicModelingServiceClient', () => {
  describe('createModel', function() {
    it('invokes createModel without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
      const model = {};
      const request = {
        parent: formattedParent,
        model: model,
      };

      // Mock response
      const name = 'name3373707';
      const done_ = true;
      const expectedResponse = {
        name: name,
        done: done_,
      };

      // Mock Grpc layer
      client._innerApiCalls.createModel = mockLongRunningGrpcMethod(request, expectedResponse);

      client.createModel(request).then(responses => {
        const operation = responses[0];
        return operation.promise();
      }).then(responses => {
        assert.deepStrictEqual(responses[0], expectedResponse);
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('invokes createModel with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
      const model = {};
      const request = {
        parent: formattedParent,
        model: model,
      };

      // Mock Grpc layer
      client._innerApiCalls.createModel = mockLongRunningGrpcMethod(request, null, error);

      client.createModel(request).then(responses => {
        const operation = responses[0];
        return operation.promise();
      }).then(() => {
        assert.fail();
      }).catch(err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });

    it('has longrunning decoder functions', () => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });
      assert(client._descriptors.longrunning.createModel.responseDecoder instanceof Function);
      assert(client._descriptors.longrunning.createModel.metadataDecoder instanceof Function);
    });
  });

  describe('listModels', () => {
    it('invokes listModels without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
      const request = {
        parent: formattedParent,
      };

      // Mock response
      const nextPageToken = '';
      const modelsElement = {};
      const models = [modelsElement];
      const expectedResponse = {
        nextPageToken: nextPageToken,
        models: models,
      };

      // Mock Grpc layer
      client._innerApiCalls.listModels = (actualRequest, options, callback) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.models);
      };

      client.listModels(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.models);
        done();
      });
    });

    it('invokes listModels with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.locationPath('[PROJECT]', '[LOCATION]');
      const request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listModels = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listModels(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getModel', () => {
    it('invokes getModel without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const request = {
        name: formattedName,
      };

      // Mock response
      const name2 = 'name2-1052831874';
      const expectedResponse = {
        name: name2,
      };

      // Mock Grpc layer
      client._innerApiCalls.getModel = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getModel(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getModel with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getModel = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getModel(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('deleteModel', () => {
    it('invokes deleteModel without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteModel = mockSimpleGrpcMethod(request);

      client.deleteModel(request, err => {
        assert.ifError(err);
        done();
      });
    });

    it('invokes deleteModel with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.deleteModel = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.deleteModel(request, err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });
  });

  describe('exportModelResults', function() {
    it('invokes exportModelResults without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const outputConfig = {};
      const request = {
        name: formattedName,
        outputConfig: outputConfig,
      };

      // Mock response
      const name2 = 'name2-1052831874';
      const done_ = true;
      const expectedResponse = {
        name: name2,
        done: done_,
      };

      // Mock Grpc layer
      client._innerApiCalls.exportModelResults = mockLongRunningGrpcMethod(request, expectedResponse);

      client.exportModelResults(request).then(responses => {
        const operation = responses[0];
        return operation.promise();
      }).then(responses => {
        assert.deepStrictEqual(responses[0], expectedResponse);
        done();
      }).catch(err => {
        done(err);
      });
    });

    it('invokes exportModelResults with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const outputConfig = {};
      const request = {
        name: formattedName,
        outputConfig: outputConfig,
      };

      // Mock Grpc layer
      client._innerApiCalls.exportModelResults = mockLongRunningGrpcMethod(request, null, error);

      client.exportModelResults(request).then(responses => {
        const operation = responses[0];
        return operation.promise();
      }).then(() => {
        assert.fail();
      }).catch(err => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        done();
      });
    });

    it('has longrunning decoder functions', () => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });
      assert(client._descriptors.longrunning.exportModelResults.responseDecoder instanceof Function);
      assert(client._descriptors.longrunning.exportModelResults.metadataDecoder instanceof Function);
    });
  });

  describe('listTopics', () => {
    it('invokes listTopics without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const request = {
        parent: formattedParent,
      };

      // Mock response
      const nextPageToken = '';
      const topicsElement = {};
      const topics = [topicsElement];
      const expectedResponse = {
        nextPageToken: nextPageToken,
        topics: topics,
      };

      // Mock Grpc layer
      client._innerApiCalls.listTopics = (actualRequest, options, callback) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.topics);
      };

      client.listTopics(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.topics);
        done();
      });
    });

    it('invokes listTopics with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const request = {
        parent: formattedParent,
      };

      // Mock Grpc layer
      client._innerApiCalls.listTopics = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listTopics(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getTopic', () => {
    it('invokes getTopic without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.topicPath('[PROJECT]', '[LOCATION]', '[MODEL]', '[TOPIC]');
      const request = {
        name: formattedName,
      };

      // Mock response
      const name2 = 'name2-1052831874';
      const description = 'description-1724546052';
      const expectedResponse = {
        name: name2,
        description: description,
      };

      // Mock Grpc layer
      client._innerApiCalls.getTopic = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getTopic(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getTopic with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.topicPath('[PROJECT]', '[LOCATION]', '[MODEL]', '[TOPIC]');
      const request = {
        name: formattedName,
      };

      // Mock Grpc layer
      client._innerApiCalls.getTopic = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getTopic(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('updateTopic', () => {
    it('invokes updateTopic without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const topic = {};
      const updateMask = {};
      const request = {
        topic: topic,
        updateMask: updateMask,
      };

      // Mock response
      const name = 'name3373707';
      const description = 'description-1724546052';
      const expectedResponse = {
        name: name,
        description: description,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateTopic = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.updateTopic(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes updateTopic with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const topic = {};
      const updateMask = {};
      const request = {
        topic: topic,
        updateMask: updateMask,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateTopic = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.updateTopic(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('listConversations', () => {
    it('invokes listConversations without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const filter = 'filter-1274492040';
      const request = {
        parent: formattedParent,
        filter: filter,
      };

      // Mock response
      const nextPageToken = '';
      const conversationsElement = {};
      const conversations = [conversationsElement];
      const expectedResponse = {
        nextPageToken: nextPageToken,
        conversations: conversations,
      };

      // Mock Grpc layer
      client._innerApiCalls.listConversations = (actualRequest, options, callback) => {
        assert.deepStrictEqual(actualRequest, request);
        callback(null, expectedResponse.conversations);
      };

      client.listConversations(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse.conversations);
        done();
      });
    });

    it('invokes listConversations with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedParent = client.modelPath('[PROJECT]', '[LOCATION]', '[MODEL]');
      const filter = 'filter-1274492040';
      const request = {
        parent: formattedParent,
        filter: filter,
      };

      // Mock Grpc layer
      client._innerApiCalls.listConversations = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.listConversations(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('getConversation', () => {
    it('invokes getConversation without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.conversationPath('[PROJECT]', '[LOCATION]', '[MODEL]', '[CONVERSATION]');
      const gcsUri = 'gcsUri-132964284';
      const request = {
        name: formattedName,
        gcsUri: gcsUri,
      };

      // Mock response
      const name2 = 'name2-1052831874';
      const gcsUri2 = 'gcsUri21070344951';
      const topic = 'topic110546223';
      const expectedResponse = {
        name: name2,
        gcsUri: gcsUri2,
        topic: topic,
      };

      // Mock Grpc layer
      client._innerApiCalls.getConversation = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.getConversation(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes getConversation with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const formattedName = client.conversationPath('[PROJECT]', '[LOCATION]', '[MODEL]', '[CONVERSATION]');
      const gcsUri = 'gcsUri-132964284';
      const request = {
        name: formattedName,
        gcsUri: gcsUri,
      };

      // Mock Grpc layer
      client._innerApiCalls.getConversation = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.getConversation(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

  describe('updateConversation', () => {
    it('invokes updateConversation without error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const conversation = {};
      const updateMask = {};
      const request = {
        conversation: conversation,
        updateMask: updateMask,
      };

      // Mock response
      const name = 'name3373707';
      const gcsUri = 'gcsUri-132964284';
      const topic = 'topic110546223';
      const expectedResponse = {
        name: name,
        gcsUri: gcsUri,
        topic: topic,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateConversation = mockSimpleGrpcMethod(
        request,
        expectedResponse
      );

      client.updateConversation(request, (err, response) => {
        assert.ifError(err);
        assert.deepStrictEqual(response, expectedResponse);
        done();
      });
    });

    it('invokes updateConversation with error', done => {
      const client = new topicmodelingModule.v1beta1.TopicModelingServiceClient({
        credentials: {client_email: 'bogus', private_key: 'bogus'},
        projectId: 'bogus',
      });

      // Mock request
      const conversation = {};
      const updateMask = {};
      const request = {
        conversation: conversation,
        updateMask: updateMask,
      };

      // Mock Grpc layer
      client._innerApiCalls.updateConversation = mockSimpleGrpcMethod(
        request,
        null,
        error
      );

      client.updateConversation(request, (err, response) => {
        assert(err instanceof Error);
        assert.strictEqual(err.code, FAKE_STATUS_CODE);
        assert(typeof response === 'undefined');
        done();
      });
    });
  });

});

function mockSimpleGrpcMethod(expectedRequest, response, error) {
  return function(actualRequest, options, callback) {
    assert.deepStrictEqual(actualRequest, expectedRequest);
    if (error) {
      callback(error);
    } else if (response) {
      callback(null, response);
    } else {
      callback(null);
    }
  };
}

function mockLongRunningGrpcMethod(expectedRequest, response, error) {
  return request => {
    assert.deepStrictEqual(request, expectedRequest);
    const mockOperation = {
      promise: function() {
        return new Promise((resolve, reject) => {
          if (error) {
            reject(error);
          }
          else {
            resolve([response]);
          }
        });
      }
    };
    return Promise.resolve([mockOperation]);
  };
}
