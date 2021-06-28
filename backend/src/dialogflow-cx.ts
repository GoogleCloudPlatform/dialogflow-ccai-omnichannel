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

import * as df from '@google-cloud/dialogflow-cx';
import * as uuid from 'uuid';

import { BotResponse } from './dialogflow-bot-responses';

import { EventEmitter } from 'events';
import { PassThrough, pipeline } from 'stream';
import { Transform } from 'stream';
import { WaveFile } from 'wavefile';

const struct = require('./structjson');

export interface QueryInputCX {
    text?: {
        text: string,
    }
    intent?: {
        intent: string  // projects/<Project ID>/locations/<Location ID>/agents/<Agent ID>/intents/<Intent ID>.
    },
    event?: {
        event: string
    },
    audio?: {
        config: {
            audioEncoding: any,
            sampleRateHertz: number
        },
        audio?: any
    },
    dtmf?: {
        digits: string,
        finish_digit: string
    },
    languageCode: string
}

export class DialogflowCX extends EventEmitter {
    public sessionClient: df.SessionsClient | df.v3beta1.SessionsClient;
    public projectId: string;
    public agentId: string;
    public location: string;
    public sessionId: string;
    public sessionPath: string;
    public config: any;
    public debug: any;

    constructor(global) {
        super();
        this.config = global;
        this.debug = global.debugger;
        this.projectId = global['gc_project_id'];
        this.agentId = global.dialogflow['cx_agent_id'];
        this.location = global.dialogflow['cx_location'];
        this.sessionId = uuid.v4();
        this.sessionClient = new df.SessionsClient(
            { apiEndpoint: `${this.location}-dialogflow.googleapis.com` }
        );
        this.sessionPath = this.sessionClient.projectLocationAgentSessionPath(
            this.projectId,
            this.location,
            this.agentId,
            this.sessionId
        );
    }

    detectIntentText(query: string, queryParams?: any, contexts?: Array<string>) {
        const qInput:QueryInputCX = {
            text: {
                text: query,
            },
            languageCode: this.config.dialogflow['language_code']
        };

        return this.detectIntent(qInput, query, contexts);
    }

    detectIntentEvent(eventName: string) {
        const qInput:QueryInputCX = {
            event: {
                event: eventName,
            },
            languageCode: this.config.dialogflow['language_code']
        };

        return this.detectIntent(qInput, eventName);
    }

    detectIntentAudioStream(stream, lang = this.config.dialogflow['language_code']){
        const qInput:QueryInputCX = {
            audio: {
                config: {
                    audioEncoding: this.config.dialogflow['encoding'],
                    sampleRateHertz: this.config.dialogflow['sample_rate_hertz'],
                }
            },
            languageCode: lang
        };

        return this.detectIntent(qInput, 'audio');
    }

    async detectIntent(qInput:QueryInputCX, input?: string, queryParams?: any, contexts?: Array<string>) {
        const request = {
            session: this.sessionPath,
            queryInput: qInput,
            queryParams
        };

        if (contexts && contexts.length > 0) {
            request.queryParams.contexts = contexts;
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

    beautifyResponses(response: any, input: string, e?: any): BotResponse{
        var botResponse: BotResponse;
        const dialogflowConfig = {
            sessionId: this.sessionId,
            sessionPath: this.sessionPath,
            projectId: this.projectId,
            agentId: this.agentId,
            dateTimeStamp: new Date().toISOString(),
            query: input, // in case DF can't detect, still store the user utterance
            languageCode: this.config.dialogflow['language_code'], // in case DF doesn't respond anything, we can still capture these
        }
        if(e) {
            this.debug.error(e);
            dialogflowConfig['error'] = e.message;
        }

        try {
            // TODO
            var uid = 'unknown';
            var country;
        } catch(e){
            console.log('no contexts set');
        }

        if(response && response.queryResult){

            var dialogflowResponses = {
                uid,
                languageCode: response.queryResult.languageCode, // override
                sentiment: response.queryResult.sentimentAnalysisResult,
                currentPage: response.queryResult.currentPage,
                responseMessages: response.queryResult.responseMessages,
                fulfillmentText: response.queryResult.responseMessages[0].text.text[0],
                webhookPayloads: response.queryResult.webhookPayloads,
                webhookStatuses: response.queryResult.webhookStatuses,
                outputAudio: response.outputAudio,
                responseId: response.responseId
            }

            if (response.queryResult.transcript) {
                dialogflowResponses['query'] = response.queryResult.transcript;
            }
            else if (response.queryResult.trigger_event) {
                dialogflowResponses['query'] = response.queryResult.trigger_event;
            }
            else if (response.queryResult.trigger_intent) {
                dialogflowResponses['query'] = response.queryResult.trigger_intent;
            } else {
                dialogflowResponses['query'] = response.queryResult.text;
            }

            if(response.queryResult.match){
                const intentDetectionObj = {
                    intentDetection: {
                        intent: {
                            displayName: response.queryResult.match.intent.displayName,
                            name: response.queryResult.intent.match.name,
                            priority: response.queryResult.match.intent.priority,
                            trainingPhrases: response.queryResult.match.intent.trainingPhrases,
                            isFallback: response.queryResult.match.intent.isFallback,
                            // TODO isWebhook: (response.queryResult.intent.webhookState !== 'WEBHOOK_STATE_UNSPECIFIED'),
                            // TODO webhookState: response.queryResult.intent.webhookState,
                            intentDetectionConfidence: response.queryResult.match.confidence
                        }
                    }
                };
                if(response.queryResult.parameters){
                    intentDetectionObj.intentDetection.intent['parameters'] = struct.structProtoToJson(
                        response.queryResult.parameters
                    );
                }
                if(country){
                    dialogflowResponses['country'] = country;
                }
                dialogflowResponses = {...dialogflowResponses, ...intentDetectionObj }
            }

            botResponse = {...dialogflowConfig, ...dialogflowResponses }
        } else {
            botResponse = dialogflowConfig;
        }

        console.log(botResponse);
        return botResponse;
    }
}

export class DialogflowCXStream extends DialogflowCX {
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
                    this.isBusy = false;
                }
            );

            this._requestStreamPassThrough.on('data', (data) => {
                const msg = JSON.parse(data.toString('utf8'));
                if (msg.event === 'start') {
                    this.debug.log(`Captured call ${msg.start.callSid}`);
                    this.emit('callStarted', {
                        callSid: msg.start.callSid,
                        streamSid: msg.start.streamSid,
                        userId: msg.start.customParameters.userId,
                        userCountry: msg.start.customParameters.FromCountry
                    });
                }
                if (msg.event === 'mark') {
                    this.debug.log(`Mark received ${msg.mark.name}`);
                    if (msg.mark.name === 'endOfInteraction') {
                        this.emit('endOfInteraction', this.getFinalQueryResult());
                    }
                }

                // TODO CAN WE GET THE DTMF?
                console.log(data);
            });

            responseStreamPassThrough.on('data', async (data) => {
                var botResponse;
                var mergeObj = {};

                if (
                  data.recognitionResult &&
                  data.recognitionResult.transcript &&
                  data.recognitionResult.transcript.length > 0
                ) {
                  this.emit('interrupted', data.recognitionResult.transcript);
                }

                console.log(data);
                // TODO - In CX DTMF is part of the QueryInput (in the StreamingDetectIntentRequest)
                // we likely can't collect it here. but in the _requestStreamPassThrough
                // if (dtmf){
                //    mergeObj['query'] = dtmf;
                // }

                if(data.recognitionResult && data.recognitionResult.isFinal) {
                  if(data.recognitionResult.transcript){
                    mergeObj['query'] = data.recognitionResult.transcript;
                  }

                  mergeObj['recognitionResult'] = {};
                  mergeObj['recognitionResult']['transcript'] = data.recognitionResult.transcript;
                  mergeObj['recognitionResult']['confidence'] = data.recognitionResult.confidence;
                }

                if(data.queryResult && data.queryResult.intent){
                  botResponse = await this.beautifyResponses(data, 'audio');
                  botResponse = {...botResponse, ...mergeObj};
                  this.emit('botResponse', botResponse);

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
                    data.queryResult.intent.endInteraction // TODO response.queryResult.responseMessages[0].endInteraction
                ) {
                    this.debug.log(
                    `Ending interaction with: ${data.queryResult.fulfillmentText}`
                    );
                    this.finalQueryResult = data.queryResult;
                    this.stop();
                }
            });
            this.audioResponseStream.on('data', (data) => {
                if(!this.isStopped){
                    this.emit('audio', data.toString('base64'));
                    this.isBusy = false;
                }
            });
            // Set ready
            this.isBusy = true;
        }
    return this._requestStreamPassThrough;
  }

    createDetectStream(queryInputObj, welcomeEvent:string, outputAudioConfig){
        let queryInput = {};
        if (this.isFirst) {
            queryInput['event'] = {
                event: welcomeEvent
            };
            queryInput['languageCode'] = this.config.dialogflow['language_code'];
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
    // STT
    createAudioRequestStream() {
        return new Transform({
            objectMode: true,
            transform: (chunk, encoding, callback) => {
                const msg = JSON.parse(chunk.toString('utf8'));
                // Only process media messages
                if (msg.event !== 'media') return callback();
                // For Twilio, this is mulaw/8000 base64-encoded
                return callback(null, { queryInput: { audio: { audio: msg.media.payload }}});
            }
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
            if (!chunk.detectIntentResponse
            || !chunk.detectIntentResponse.outputAudio || chunk.detectIntentResponse.outputAudio.length === 0) {
                return callback();
            }
            wav.fromBuffer(chunk.detectIntentResponse.outputAudio);
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
        this.isBusy = true;
        this.isStopped = true;
    }
}