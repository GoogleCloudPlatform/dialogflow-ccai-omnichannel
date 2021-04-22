/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

 import { global } from './config';
 import * as df from '@google-cloud/dialogflow';
 import * as uuid from 'uuid';
 import { debug } from './debug';
 import { BotResponse } from './dialogflow-bot-responses';
 import { EventEmitter } from 'events';
 import { PassThrough, pipeline } from 'stream';
 import { Transform } from 'stream';

 const struct = require('./structjson');

 export interface QueryInputV2Beta1 {
     event?: {
         name: string,
         languageCode: string
         parameters?: object
     }
     text?: {
         text: string,
         languageCode: string
     }
     audioConfig?: {
         audioEncoding: any,
         sampleRateHertz: number
         languageCode: string
     }
 }

 export class DialogflowV2Beta1 extends EventEmitter {
     public sessionClient: df.v2beta1.SessionsClient;
     public projectId: string;
     public sessionId: string;
     public sessionPath: string;

     constructor() {
         super();
         this.projectId = global['gc_project_id'];
         this.sessionId = uuid.v4();
         this.sessionClient = new df.v2beta1.SessionsClient();
         this.sessionPath = this.sessionClient.projectAgentSessionPath(this.projectId, this.sessionId);
     }

     detectIntentText(query: string, lang = global.dialogflow['language_code'], contexts?: Array<string>) {
         const qInput:QueryInputV2Beta1 = {
             text: {
               text: query,
               languageCode: lang
             }
         };

         return this.detectIntent(qInput, query, contexts);
     }

     detectIntentEvent(eventName: string, lang = global.dialogflow['language_code'], params = null) {
         const qInput:QueryInputV2Beta1 = {
             event: {
                 name: eventName,
                 languageCode: lang
               }
         };

         if(params) qInput.event.parameters = struct.encode(params);

         return this.detectIntent(qInput, eventName);
     }

     detectIntentAudioStream(stream:any, lang = global.dialogflow['lang_code']){
         const qInput:QueryInputV2Beta1 = {
             audioConfig: {
               audioEncoding: global.dialogflow['encoding'],
               sampleRateHertz: global.dialogflow['sample_rate_hertz'],
               languageCode: lang
             },
         };

         return this.detectIntent(qInput, 'audio');
     }

     async detectIntent(qInput:QueryInputV2Beta1, input?: string, contexts?: Array<string>) {
         const request = {
             session: this.sessionPath,
             queryInput: qInput,
             queryParams: null
         };

         if (contexts && contexts.length > 0) {
             request.queryParams.contexts = contexts;
         }

         var botResponse;
         try {
             const [response] = await this.sessionClient.detectIntent(request);
             // debug.log(response);
             botResponse = this.beautifyResponses(response, input);
         } catch(e) {
             debug.error(e);
             botResponse = this.beautifyResponses(null, input, e);
         }
         // debug.log(botResponse);
         return botResponse;
     }

     beautifyResponses(response: any, input: string, e?: any): BotResponse{
         var botResponse: BotResponse;
         const dialogflowConfig = {
             sessionId: this.sessionId,
             sessionPath: this.sessionPath,
             projectId: this.projectId,
             dateTimeStamp: new Date().getTime()/1000,
             text: input, // in case DF doesn't respond anything, we can still capture these
             languageCode: global.dialogflow['language_code'], // in case DF doesn't respond anything, we can still capture these
         }
         if(e) {
             debug.error(e);
             dialogflowConfig['error'] = e.message;
         }

         if(response && response.queryResult){

             var dialogflowResponses = {
                 languageCode: response.queryResult.languageCode, // override
                 sentiment: response.queryResult.sentimentAnalysisResult,
                 text: response.queryResult.queryText, // override
                 responseMessages: response.queryResult.fulfillmentMessages,
                 webhookPayloads: response.queryResult.webhookPayload,
                 webhookStatuses: response.queryResult.webhookStatus,
                 webhookSource: response.queryResult.webhookSource,
                 outputAudio: response.outputAudio,
                 responseId: response.responseId,
                 action: response.queryResult.action,
             }

             if(response.queryResult.intent){
                 const intentDetectionObj = {
                     intentDetection: {
                         intent: {
                             displayName: response.queryResult.intent.displayName,
                             name: response.queryResult.intent.name,
                             parameters: response.queryResult.intent.parameters,
                             priority: response.queryResult.intent.priority,
                             trainingPhrases: response.queryResult.intent.trainingPhrases,
                             isFallback: response.queryResult.intent.isFallback,
                             intentDetectionConfidence: response.queryResult.intentDetectionConfidence,
                             isEndInteraction: response.queryResult.intent.endInteraction,
                             events: response.queryResult.intent.events,
                             isLiveAgent: response.queryResult.intent.liveAgentHandoff,
                             inputContextNames: response.queryResult.intent.inputContextNames,
                             outputContexts: response.queryResult.intent.outputContexts,
                             resetContexts: response.queryResult.intent.resetContexts,
                             rootFollowupIntentName: response.queryResult.intent.rootFollowupIntentName,
                             parentFollowupIntentName: response.queryResult.intent.parentFollowupIntentName,
                             followupIntentInfo: response.queryResult.intent.followupIntentInfo,
                         }
                     }
                 };
                 dialogflowResponses = {...dialogflowResponses, ...intentDetectionObj }
             }

             botResponse = {...dialogflowConfig, ...dialogflowResponses }
         } else {
             botResponse = dialogflowConfig;
         }
         return botResponse;
     }
 }

export class DialogflowV2Beta1Stream extends DialogflowV2Beta1 {
    public isFirst: boolean;
    public isReady: boolean;
    public isStopped: boolean;
    public isInterrupted: boolean;
    public audioResponseStream: Transform;
    public finalQueryResult: any;
    private _requestStreamPassThrough: PassThrough;

    constructor() {
      super();

      // State management
      this.isFirst = true;
      this.isReady = false;
      this.isStopped = false;
      this.isInterrupted = false;
    }

    send(message, createAudioResponseStream, outputAudioConfig) {
      const stream = this.startPipeline(createAudioResponseStream, outputAudioConfig);
      stream.write(message);
    }

    getFinalQueryResult() {
      if (this.finalQueryResult) {
        const queryResult = {
          intent: {
            name: this.finalQueryResult.intent.name,
            displayName: this.finalQueryResult.intent.displayName,
          },
          parameters: struct.structProtoToJson(
            this.finalQueryResult.parameters
          ),
        };
        return queryResult;
      } else {
        return null;
      }
    }

    startPipeline(createAudioResponseStream: Function, outputAudioConfig) {
      if (!this.isReady) {
        // Generate the streams
        this._requestStreamPassThrough = new PassThrough({ objectMode: true });
        const audioStream = this.createAudioRequestStream();
        const detectStream = this.createDetectStream(outputAudioConfig);

        const responseStreamPassThrough = new PassThrough({ objectMode: true });
        this.audioResponseStream = createAudioResponseStream();
        if (this.isFirst) this.isFirst = false;
        this.isInterrupted = false;
        // Pipeline is async....
        pipeline(
          this._requestStreamPassThrough,
          audioStream,
          detectStream,
          responseStreamPassThrough,
          this.audioResponseStream,
          (err) => {
            if (err) {
              this.emit('error', err);
            }
            // Update the state so as to create a new pipeline
            this.isReady = false;
          }
        );

        this._requestStreamPassThrough.on('data', (data) => {
          const msg = JSON.parse(data.toString('utf8'));
          if (msg.event === 'start') {
            console.log(`Captured call ${msg.start.callSid}`);
            this.emit('callStarted', {
              callSid: msg.start.callSid,
              streamSid: msg.start.streamSid
            });
          }
          if (msg.event === 'mark') {
            console.log(`Mark received ${msg.mark.name}`);
            if (msg.mark.name === 'endOfInteraction') {
              this.emit('endOfInteraction', this.getFinalQueryResult());
            }
          }
        });

        responseStreamPassThrough.on('data', (data) => {
          if (
            data.recognitionResult &&
            data.recognitionResult.transcript &&
            data.recognitionResult.transcript.length > 0
          ) {
            this.emit('interrupted', data.recognitionResult.transcript);
          }
          if (
            data.queryResult &&
            data.queryResult.intent &&
            data.queryResult.intent.endInteraction
          ) {
            console.log(
              `Ending interaction with: ${data.queryResult.fulfillmentText}`
            );
            this.finalQueryResult = data.queryResult;
            this.stop();
          }
        });
        this.audioResponseStream.on('data', (data) => {
          this.emit('audio', data.toString('base64'));
        });
        // Set ready
        this.isReady = true;
      }
      return this._requestStreamPassThrough;
  }

  createDetectStream(outputAudioConfig){

    const queryInput = {
      audioConfig: {
        audioEncoding: global.twilio['input_encoding'],
        sampleRateHertz: global.twilio['sample_rate_hertz'],
        languageCode: global.dialogflow['language_code'],
        singleUtterance: global.twilio['single_utterance'],
      },
      interimResults: global.twilio['interim_results'],
    };
    if (this.isFirst) {
      queryInput['event'] = {
          name: global.twilio['welcome_event'],
          languageCode: global.dialogflow['language_code'],
      };
    }

    const initialStreamRequest = {
      queryInput,
      session: this.sessionPath,
      queryParams: {
        session: this.sessionPath
      },
      outputAudioConfig
    };

    const detectStream = this.sessionClient.streamingDetectIntent();
    detectStream.write(initialStreamRequest);
    return detectStream;
  }

  // create audio dialogflow request stream
  createAudioRequestStream() {
    return new Transform({
      objectMode: true,
      transform: (chunk, encoding, callback) => {
        const msg = JSON.parse(chunk.toString('utf8'));
        // Only process media messages
        if (msg.event !== 'media') return callback();
        // For Twilio, this is mulaw/8000 base64-encoded
        return callback(null, { inputAudio: msg.media.payload });
      },
    });
  }

  stop() {
    console.log('Stopping Dialogflow');
    this.isStopped = true;
  }

  finish() {
    console.log('Disconnecting from Dialogflow');
    this._requestStreamPassThrough.end();
  }
}