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

 import * as df from '@google-cloud/dialogflow';
 import * as uuid from 'uuid';
 import { BotResponse } from './dialogflow-bot-responses';
 import { EventEmitter } from 'events';
 import { PassThrough, pipeline } from 'stream';
 import { Transform } from 'stream';
 import { WaveFile } from 'wavefile';
import { User } from 'actions-on-google/dist/service/actionssdk/conversation/user';
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
     public contextClient: df.v2beta1.ContextsClient;
     public projectId: string;
     public sessionId: string;
     public sessionPath: string;
     public config: any;
     public debug: any;

     constructor(global) {
         super();
         this.config = global;
         this.debug = global.debugger;
         this.projectId = global['gc_project_id'];
         this.sessionId = uuid.v4();
         this.sessionClient = new df.v2beta1.SessionsClient();
         this.sessionPath = this.sessionClient.projectAgentSessionPath(this.projectId, this.sessionId);
         this.contextClient = new df.v2beta1.ContextsClient();
     }

     detectIntentText(query: string, contexts?: Array<any>) {
         const qInput:QueryInputV2Beta1 = {
             text: {
               text: query,
               languageCode: this.config.dialogflow['language_code']
             }
         };

         return this.detectIntent(qInput, query, contexts);
     }

     detectIntentEvent(eventName: string, queryParams?: any) {
         const qInput:QueryInputV2Beta1 = {
             event: {
                 name: eventName,
                 languageCode: this.config.dialogflow['language_code']
               }
         };

         if(queryParams) qInput.event.parameters = queryParams;

         return this.detectIntent(qInput, eventName);
     }

     detectIntentAudioStream(stream:any, lang = this.config.dialogflow['lang_code']){
         const qInput:QueryInputV2Beta1 = {
             audioConfig: {
               audioEncoding: this.config.dialogflow['encoding'],
               sampleRateHertz: this.config.dialogflow['sample_rate_hertz'],
               languageCode: lang
             },
         };

         return this.detectIntent(qInput, 'audio');
     }

     async detectIntent(qInput:QueryInputV2Beta1, input?: string, contexts?: Array<any>) {
        const me = this;
        const request = {
             session: this.sessionPath,
             queryInput: qInput
        }

        if (contexts && contexts.length > 0) {
          contexts.forEach(async function(contextObj) {
            await me.createContext(Object.keys(contextObj)[0], contextObj);
          });
        }

         var botResponse;
         try {
             const [response] = await this.sessionClient.detectIntent(request);
             this.debug.log(response);
             botResponse = this.beautifyResponses(response, input);
         } catch(e) {
             this.debug.error(e);
             botResponse = this.beautifyResponses(null, input, e);
         }
         this.debug.log(botResponse);
         return botResponse;
     }

     async createContext(contextId, parameters, lifespan = 333) {
      const request = {
          parent: this.sessionPath,
          context: {
              name: `${this.sessionPath}/contexts/${contextId}`,
              parameters: struct.jsonToStructProto(parameters),
              lifespanCount: lifespan
          }
      };
      await this.contextClient.createContext(request)
    }

    async getContext(contextId) {
      var ctx = await this.contextClient.getContext({
        name: `${this.sessionPath}/contexts/${contextId}`
      });
      var jsonCtx = struct.structProtoToJson(ctx[0].parameters);
      return jsonCtx;
    }

     async beautifyResponses(response: any, input: string, e?: any) {
         var botResponse: BotResponse;
         const dialogflowConfig = {
             sessionId: this.sessionId,
             sessionPath: this.sessionPath,
             projectId: this.projectId,
             dateTimeStamp: new Date().toISOString(),
             query: input, // in case DF can't detect, still store the user utterance
             languageCode: this.config.dialogflow['language_code'], // in case DF doesn't respond anything, we can still capture these
         }
         if(e) {
             this.debug.error(e);
             dialogflowConfig['error'] = e.message;
         }

         try {
          var ctx = await this.getContext('user');
          var uid = 'unknown';
          if(ctx.user) {
              uid = ctx.user.uid;
          }
         } catch(e){
          console.log('no contexts set');
         }

         if(response && response.queryResult){
             var dialogflowResponses = {
                 userId: uid,
                 languageCode: response.queryResult.languageCode, // override
                 query: response.queryResult.queryText,
                 responseMessages: response.queryResult.fulfillmentMessages,
                 fulfillmentText: response.queryResult.fulfillmentText,
                 webhookPayloads: response.queryResult.webhookPayload,
                 webhookStatuses: response.queryResult.webhookStatus,
                 webhookSource: response.queryResult.webhookSource,
                 outputAudio: response.outputAudio,
                 responseId: response.responseId,
                 action: response.queryResult.action,
             }
             if(response.queryResult.sentimentAnalysisResult && response.queryResult.sentimentAnalysisResult.queryTextSentiment){
              dialogflowResponses['sentiment'] = response.queryResult.sentimentAnalysisResult.queryTextSentiment;
             }
             /// TODO something breaks here
             if(response.queryResult && response.queryResult.intent){
                 const intentDetectionObj = {
                     intentDetection: {
                         intent: {
                             displayName: response.queryResult.intent.displayName,
                             name: response.queryResult.intent.name,
                             priority: response.queryResult.intent.priority,
                             trainingPhrases: response.queryResult.intent.trainingPhrases,
                             isFallback: response.queryResult.intent.isFallback,
                             intentDetectionConfidence: response.queryResult.intentDetectionConfidence,
                             isEndInteraction: response.queryResult.intent.endInteraction,
                             isLiveAgent: response.queryResult.intent.liveAgentHandoff,
                             isWebhook: (response.queryResult.intent.webhookState !== 'WEBHOOK_STATE_UNSPECIFIED'),
                             webhookState: response.queryResult.intent.webhookState,
                             inputContextNames: response.queryResult.intent.inputContextNames,
                             outputContexts: response.queryResult.intent.outputContexts,
                             resetContexts: response.queryResult.intent.resetContexts,
                             rootFollowupIntentName: response.queryResult.intent.rootFollowupIntentName,
                             parentFollowupIntentName: response.queryResult.intent.parentFollowupIntentName,
                             followupIntentInfo: response.queryResult.intent.followupIntentInfo,
                         }
                     }
                 };
                 if(response.queryResult.parameters){
                  intentDetectionObj.intentDetection.intent['parameters'] = struct.structProtoToJson(
                    response.queryResult.parameters
                  );
                 }
                 dialogflowResponses = {...dialogflowResponses, ...intentDetectionObj }
             }

             botResponse = {...dialogflowConfig, ...dialogflowResponses }
         } else {
             botResponse = dialogflowConfig;
         }

         this.debug.log(botResponse);
         return botResponse;
     }
 }

export class DialogflowV2Beta1Stream extends DialogflowV2Beta1 {
    public isFirst: boolean;
    public isBusy: boolean;
    public isStopped: boolean;
    public isInterrupted: boolean;
    public audioResponseStream: Transform;
    public finalQueryResult: any;
    private _requestStreamPassThrough: PassThrough;

    constructor(global) {
      super(global);

      // State management
      this.isFirst = true;
      this.isBusy = false;
      this.isStopped = false;
      this.isInterrupted = false;
    }

    send(message, queryInputObj, welcomeEvent:string, outputAudioConfig) {
      const stream = this.startPipeline(queryInputObj, welcomeEvent, outputAudioConfig);
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

    startPipeline(queryInputObj, welcomeEvent:string, outputAudioConfig) {
      if (!this.isBusy) {
        // Generate the streams
        this._requestStreamPassThrough = new PassThrough({ objectMode: true });
        const audioStream = this.createAudioRequestStream();
        const detectStream = this.createDetectStream(queryInputObj, welcomeEvent, outputAudioConfig);

        const responseStreamPassThrough = new PassThrough({ objectMode: true });
        this.audioResponseStream = this.createAudioResponseStream();

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
            this.isBusy = false;
          }
        );

        this._requestStreamPassThrough.on('data', (data) => {
          const msg = JSON.parse(data.toString('utf8'));
          if (msg.event === 'start') {
            this.debug.log(`Captured call ${msg.start.callSid}`);
            this.emit('callStarted', {
              callSid: msg.start.callSid,
              streamSid: msg.start.streamSid
            });
          }
          if (msg.event === 'mark') {
            this.debug.log(`Mark received ${msg.mark.name}`);
            if (msg.mark.name === 'endOfInteraction') {
              this.emit('endOfInteraction', this.getFinalQueryResult());
            }
          }
        });

        // TODO
        // CHANGES FOR CX
        responseStreamPassThrough.on('data', (data) => {
          var botResponse;
          var mergeObj = {};

          if (
            data.recognitionResult &&
            data.recognitionResult.transcript &&
            data.recognitionResult.transcript.length > 0
          ) {
            this.emit('interrupted', data.recognitionResult.transcript);
          }

          if(data.recognitionResult && data.recognitionResult.isFinal) {
            if(data.recognitionResult.transcript){
              mergeObj['query'] = data.recognitionResult.transcript;
            }
            if(data.recognitionResult.dtmfDigits){
              // TODO for CX this will be different
              mergeObj['query'] = data.recognitionResult.dtmfDigits;
            }

            mergeObj['recognitionResult'] = {};
            mergeObj['recognitionResult']['transcript'] = data.recognitionResult.transcript;
            mergeObj['recognitionResult']['confidence'] = data.recognitionResult.confidence;
          }

          if(data.queryResult && data.queryResult.intent){
            botResponse = this.beautifyResponses(data, 'audio');
            botResponse['recognitionResult'] = {};
            if(mergeObj && mergeObj['recognitionResult']) {
              botResponse['recognitionResult']['transcript'] = mergeObj['recognitionResult']['transcript'];
              botResponse['recognitionResult']['confidence'] = mergeObj['recognitionResult']['confidence'];
            }
            this.emit('botResponse', botResponse);

            // TODO for CX this will be different
            // TODO this should be in a business logics layer
            if(data.queryResult.intent.parameters &&
              data.queryResult.intent.parameters.action &&
              data.queryResult.intent.parameters.action === 'HANDOVER'
              ){
              botResponse['intentDetection']['isLiveAgent'] = true;
              this.emit('isHandOver', botResponse);
            }
          }

          if (
            data.queryResult &&
            data.queryResult.intent &&
            data.queryResult.intent.endInteraction
          ) {
            this.debug.log(
              `Ending interaction with: ${data.queryResult.fulfillmentText}`
            );
            this.finalQueryResult = data.queryResult;
            this.stop();
          }
        });

        this.audioResponseStream.on('data', (data) => {
          // data is the wav samples to return
          this.emit('audio', data.toString('base64'));
          this.isBusy = false;
        });

        this.isBusy = true;
      }
      return this._requestStreamPassThrough;
  }

  createDetectStream(queryInputObj, welcomeEvent:string, outputAudioConfig){
    let queryInput = {};
    if (this.isFirst) {
      queryInput['event'] = {
        name: welcomeEvent,
        languageCode: this.config.dialogflow['language_code']
      }
    }

    queryInput = {...queryInput, ...queryInputObj }

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

  // Create audio response stream for twilio
  // Convert the LINEAR 16 Wavefile to 8000/mulaw
  // TTS
  createAudioResponseStream() {
    return new Transform({
      objectMode: true,
      transform: (chunk, encoding, callback) => {
        const wav = new WaveFile();
        if (!chunk.outputAudio || chunk.outputAudio.length === 0) {
          return callback();
        }
        wav.fromBuffer(chunk.outputAudio);
        wav.toSampleRate(8000);
        wav.toMuLaw();

        return callback(null, Buffer.from(wav.data['samples']));
      },
    });
  }

  stop() {
    this.debug.log('Stopping Dialogflow');
    this.isStopped = true;
  }

  finish() {
    this.debug.log('Disconnecting from Dialogflow');
    this._requestStreamPassThrough.end();
  }
}
