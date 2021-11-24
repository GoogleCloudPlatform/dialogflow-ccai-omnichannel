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
// import * as df from '../libs/dialogflow-v3alpha1-nodejs/src/v3alpha1';
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
    public sessionClient: df.SessionsClient | df.SessionsClient | any;
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

    detectIntentText(query: string, queryParams?: any, sessionParams?: Array<string>) {
        const qInput:QueryInputCX = {
            text: {
                text: query,
            },
            languageCode: this.config.dialogflow['language_code']
        };

        var timeZone = {}
        timeZone['timeZone'] = this.config.dialogflow['timezone'];
        let session = {
            ...timeZone,
            ...sessionParams
        };

        return this.detectIntent(qInput, query, session);
    }

    detectIntentEvent(eventName: string, sessionParams?: Array<string>) {
        const qInput:QueryInputCX = {
            event: {
                event: eventName,
            },
            languageCode: this.config.dialogflow['language_code']
        };

        var timeZone = {}
        timeZone['timeZone'] = this.config.dialogflow['timezone'];
        let session = {
            ...timeZone,
            ...sessionParams
        };

        return this.detectIntent(qInput, eventName, session);
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

    async detectIntent(qInput:QueryInputCX, routeInput?: string, sessionParams?: any) {
        const request = {
            session: this.sessionPath,
            queryInput: qInput,
            queryParams: {}
        };

        if(sessionParams) {;
            this.setSessionParams(request, sessionParams);
        }

        var botResponse;
        try {
            const [response] = await this.sessionClient.detectIntent(request);
            this.debug.log(response);
            botResponse = this.beautifyResponses(response, routeInput);
        } catch(e) {
            this.debug.error(e);
            botResponse = this.beautifyResponses(null, routeInput, e);
        }
        this.debug.log(botResponse);
        return botResponse;
    }

    setSessionParams(request, sessionParams){
        request.queryParams['parameters'] = struct.jsonToStructProto(sessionParams);
        return request;
    }

    getSessionParam(res, sessionParam) {
        var sessionParams = struct.structProtoToJson(res.parameters);
        // this.debug.log(sessionParams);
        if(sessionParams['0']){
            // web channel messages will get & set the user data
            // through session params, which is a struct.
            return sessionParams['0'][sessionParam];
        } else {
            // When the SMS webhook POSTs to the /api/sms URL
            // you will get the user data from the session request
            return sessionParams[sessionParam];
        }
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

        if(response && response.queryResult){

            var uid = this.getSessionParam(response.queryResult, 'user');
            var country = this.getSessionParam(response.queryResult, 'country');
            this.debug.log(uid, country);

            var dialogflowResponses = {
                uid,
                sessionInfo: {
                    uid,
                    uCountry: country
                },
                languageCode: response.queryResult.languageCode, // override
                sentiment: response.queryResult.sentimentAnalysisResult,
                currentPage: response.queryResult.currentPage,
                responseMessages: response.queryResult.responseMessages,
                fulfillmentText: response.queryResult.responseMessages[0].text.text[0],
                webhookPayloads: response.queryResult.webhookPayloads,
                webhookStatuses: response.queryResult.webhookStatuses,
                outputAudio: response.outputAudio,
                responseId: response.responseId,
                tool: this.config.dialogflow['version'],
                vertical: this.config.vertical
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

            if(response.queryResult.match && response.queryResult.match.intent){
                const intentDetectionObj = {
                    intentDetection: {
                        intent: {
                            displayName: response.queryResult.match.intent.displayName,
                            name: response.queryResult.match.intent.name,
                            priority: response.queryResult.match.intent.priority,
                            trainingPhrases: response.queryResult.match.intent.trainingPhrases,
                            isFallback: response.queryResult.match.intent.isFallback,
                            // TODO isWebhook: (response.queryResult.intent.webhookState !== 'WEBHOOK_STATE_UNSPECIFIED'),
                            // TODO webhookState: response.queryResult.intent.webhookState,
                            intentDetectionConfidence: response.queryResult.match.confidence
                        }
                    }
                };
                // this might be duplicated
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

export class DialogflowCXStream extends DialogflowCX {
    public isFirst: boolean;
    public isBusy: boolean;
    public isStopped: boolean;
    public isRequestAudio: boolean;
    public isBargeIn: boolean;
    public isInputAudioTriggered: boolean;
    public isInterrupted: boolean;
    public audioResponseStream: Transform;
    public audioRequestStream: Transform;
    public detectStream: any;
    public finalQueryResult: any;
    public inputAudioTriggerCounter: number;
    public inputAudioTriggerDuration: number;
    public inputAudioTriggerLevel: number;
    public noBargeInDuration: number;
    public totalDuration: number;
    private _requestStreamPassThrough: PassThrough;
    private _responseStreamPassThrough: PassThrough;

    constructor(global) {
      super(global);

      // State management
      this.isFirst = true;
      this.isBusy = false;
      this.isStopped = false;
      this.isInterrupted = false;
      this.isRequestAudio = false;
      this.isBargeIn = false;
      this.isInputAudioTriggered = false;
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
        if (!this.isBusy && !this.isStopped) {

            // Generate the streams
            this._requestStreamPassThrough = new PassThrough({ objectMode: true });
            this.audioRequestStream = this.createAudioRequestStream();
            this.detectStream = this.createDetectStream(queryInputObj, welcomeEvent, outputAudioConfig);

            this._responseStreamPassThrough = new PassThrough({ objectMode: true });
            this.audioResponseStream = this.createAudioResponseStream();

            if (this.isFirst) this.isFirst = false;
            this.isInterrupted = false;

            // Pipeline is async....
            pipeline(
                this._requestStreamPassThrough,
                this.audioRequestStream,
                this.detectStream,
                this._responseStreamPassThrough,
                this.audioResponseStream,
                (err) => {
                    if (err) {
                        this.emit('pipelineError', err);
                        if (err['code'] && err['code'] === '3') {
                          this.debug.error('CXUtils: startPipeline handling CX API error code 3, shutting down pipeline');
                          this.stop();
                          this.finish();
                        }
                    } else {
                        this.closingDetectStreams();
                    }
                    this.isBusy = false;
                }
            );

            this._requestStreamPassThrough.on('data', (data) => {
                // At the start of the call, we can capture
                // the call ID, and the USER INFO
                // We will need to store this in a session parameter
                const msg = JSON.parse(data.toString('utf8'));
                var me = this;
                if (msg.event === 'start') {
                    this.debug.log(`Captured call ${msg.start.callSid}`);
                    var sessionParams = {
                        callSid: msg.start.callSid,
                        streamSid: msg.start.streamSid,
                        userId: msg.start.customParameters.userId,
                        userCountry: msg.start.customParameters.userCountry
                    };
                    this.emit('callStarted', sessionParams);

                    // TODO DF CX Specific
                    // For storing data in BQ
                    // this.setSessionParams(request, sessionParams);

                }
                if (msg.event === 'mark') {
                    this.debug.log(`Mark received ${msg.mark.name}`);
                    if (msg.mark.name === 'endOfInteraction') {
                        this.emit('endOfInteraction', this.getFinalQueryResult());
                    } else if (msg.mark.name === 'endOfTurnMediaPlayback') {
                        this.debug.log('CXUtils: _requestStreamPassThrough/data endOfTurnMediaPlayback mark');
                        if (!this.isBargeIn) {
                            // when you don't interupt wait till the audio playback is over
                            // and then set isBusy to falls
                            this.isBusy = false;
                        } else {
                            this.isBusy = true;
                        }
                        if (this.isStopped) {
                          this.emit('endOfInteraction', this.getFinalQueryResult());
                        }
                        // else set to listening
                        this.isRequestAudio = true;
                    }
                }
                if (msg.event === 'stop') {
                    me.debug.log('CXUtils: _requestStreamPassThrough/data event Call stopped');
                }
                if (msg.event === 'media') {
                    // only process input audio and trigger once
                    if (this.isRequestAudio && !this.isInputAudioTriggered) {
                      this.processInputAudioChunk(msg);
                      this.updateInputAudioState();
                    } else {
                      // reset trigger and counters
                      if (this.isInputAudioTriggered) {
                        this.resetInputAudioState();
                      }
                    }
                  }
            });

            this._responseStreamPassThrough.on('data', async (data) => {
                var botResponse;
                var mergeObj = {};

                if (data.recognitionResult &&
                    data.recognitionResult.messageType) {
                        this.debug.log('CXUtils: _responseStreamPassThrough/data event : recognitionResult of '
                            + JSON.stringify(data.recognitionResult.messageType));
                      if (data.recognitionResult.messageType === 'END_OF_SINGLE_UTTERANCE') {
                        this.debug.log('CXUtils: _responseStreamPassThrough/data event : END_OF_SINGLE_UTTERANCE detected.');
                      } else if (data.recognitionResult.messageType === 'TRANSCRIPT') {
                        this.debug.log('CXUtils: _responseStreamPassThrough/data event :  TRANSCRIPT detected.');
                      }
                  }

                if (
                  data.recognitionResult &&
                  data.recognitionResult.transcript &&
                  data.recognitionResult.transcript.length > 0
                ) {
                  this.emit('interrupted', data.recognitionResult.transcript);
                  this.debug.log(`CXUtils: Recognize: ${JSON.stringify(data.recognitionResult)}`);
                  this.isRequestAudio = false;
                  this.isInputAudioTriggered = true; // stop all audio triggers
                }

                // get the transcript to write in BQ
                /*if(data.recognitionResult && data.recognitionResult.isFinal) {
                    if(data.recognitionResult.transcript){
                    mergeObj['query'] = data.recognitionResult.transcript;
                    }

                    mergeObj['recognitionResult'] = {};
                    mergeObj['recognitionResult']['transcript'] = data.recognitionResult.transcript;
                    mergeObj['recognitionResult']['confidence'] = data.recognitionResult.confidence;
                }*/

                this.debug.log(`CXUtils: Here are the data results: ${JSON.stringify(data)}`);

                if (data.detectIntentResponse &&
                    data.detectIntentResponse.queryResult &&
                    data.detectIntentResponse.queryResult.currentPage) {

                    if (data.detectIntentResponse.queryResult.currentPage.displayName === 'End Session') {
                      // handle end session
                      this.debug.log(
                        `CXUtils: _responseStreamPassThrough/data event : Dialogflow CX ending interaction on ${JSON.stringify(data.detectIntentResponse.queryResult.intent.displayName)}`
                      );
                      this.finalQueryResult = data.detectIntentResponse.queryResult;
                      this.stop();
                    } else {

                        this.debug.log(`CXUtils: Here are the query results: ${JSON.stringify(data.detectIntentResponse.queryResult)}`);
                        this.debug.log(`CXUtils: Here are the audio results: ${JSON.stringify(data.detectIntentResponse.outputAudio)}`);

                      // all other intermediate responses
                      if (data.detectIntentResponse.queryResult.responseMessages &&
                        data.detectIntentResponse.queryResult.responseMessages[0] &&
                        data.detectIntentResponse.queryResult.responseMessages[0].text &&
                        data.detectIntentResponse.queryResult.responseMessages[0].text.text) {
                        this.debug.log(
                          `CXUtils: _responseStreamPassThrough/data event : Dialogflow CX turn response with: ${data.detectIntentResponse.queryResult.responseMessages[0].text.text}`
                        );
                        this.finalQueryResult = data.detectIntentResponse.queryResult;
                      }

                      // calculate duration of audio to delay Telephony signalling
                      if (data.detectIntentResponse.outputAudio) {
                        // reset counters
                        this.noBargeInDuration = 0;
                        this.totalDuration = 0;
                        // data.detectIntentResponse.outputAudio is audio buffer
                        this.debug.log('CXUtils: _responseStreamPassThrough/data calculating audio playback time');
                        this.noBargeInDuration =
                            this.getLengthOfWAV(Buffer.from(data.detectIntentResponse.outputAudio).length, this.config.twilio['sample_rate_hertz'], 16, 1);
                        this.totalDuration =
                            this.getLengthOfWAV(Buffer.from(data.detectIntentResponse.outputAudio).length, this.config.twilio['sample_rate_hertz'], 16, 1);
                        this.debug.log('CXUtils: _responseStreamPassThrough/data computed noBargeInDuration ' + this.noBargeInDuration);
                        this.debug.log('CXUtils: _responseStreamPassThrough/data computed totalDuration ' + this.totalDuration);
                      }
                    }
                    this.emit('endTurn', this.finalQueryResult);
                    botResponse = await this.beautifyResponses(data, 'audio');
                    botResponse = {...botResponse, ...mergeObj};
                    this.debug.log(`CXUtils: botResponse + ${JSON.stringify(botResponse)}`);
                    this.emit('botResponse', botResponse);
                    this.isBusy = true;
                  }

                // TODO PAK does not have this part of code
                /*
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

                    // TODO PAK
                    if (!this.isFirst) {
                        if(this.detectStream && this.audioRequestStream){
                            this.closingStreams();
                        }
                    }
                }*/
            });
            this.audioResponseStream.on('data', (data) => {
                if(!this.isStopped){
                    this.emit('audio', data.toString('base64'));
                }

                console.log(`CXUtils: Barge in: ${this.isBargeIn}`);
                if (!this.isBargeIn) {
                    this.isBusy = false;
                } // TODO
            });

            this.audioResponseStream.on('error', (err) => {
                this.debug.log('CXUtils: audioResponseStream/error Error on response stream ... ignoring. ' + err);
                // this.stop();
                // handle error 3, need to shut down pipeline
                if (err === undefined) {
                  this.debug.log('CXUtils: audioResponseStream/error Handling undefined error, shutting down pipeline');
                  this.stop();
                  this.finish();
                } else if (err['code'] && err['code'] === 3) {
                  this.debug.error('CXUtils: audioResponseStream/error Handling CX API error code 3, shutting down pipeline');
                  this.stop();
                  this.finish();
                }
            });
        }
    return this._requestStreamPassThrough;
  }

    createDetectStream(queryInputObj, welcomeEvent:string, outputAudioConfig){
        let queryInput = {};
        if (this.isFirst) {
            this.debug.log(`CXUtils: Welcome event: ${welcomeEvent}`);
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
            wav.toSampleRate(this.config.twilio['sample_rate_hertz']);
            wav.toMuLaw();

            return callback(null, Buffer.from(wav.data['samples']));
        },
        });
    }

    // processes input audio chunks to detect speech trigger
    processInputAudioChunk(chunk) {
        var count = (chunk.media.payload.match(/\//g) || []).length;
        if (count < this.inputAudioTriggerLevel) {
        // logger.trace('CCAIUtils: _requestStream heandler audio request chunk / count : ' + count);
        this.inputAudioTriggerCounter++;
        }
        if (this.inputAudioTriggerCounter > this.inputAudioTriggerDuration) {
        this.isInputAudioTriggered = true;
        }
    }

    // detects and handles input audio trigger and resets counters and state
    updateInputAudioState() {
        if (this.isInputAudioTriggered) {
        this.debug.log('CXUtils: updateInputAudioState Input Audio triggered, user utterance detected.');
        // reset here not required, but defensive to pick up miscues
        this.inputAudioTriggerCounter = 0;
        this.isInputAudioTriggered = false;
        }
    }

    // resets input audio counters to prepare for next turn
    resetInputAudioState() {
        this.inputAudioTriggerCounter = 0;
        this.isInputAudioTriggered = false;
    }


    stop() {
        this.debug.log('CXUtils: Stopping Dialogflow CX');
        this.isStopped = true;
    }

    finish() {
        this.debug.log('CXUtils: Disconnecting from Dialogflow CX');
        this.isStopped = true;
        this.isInterrupted = true;
        this.closingDetectStreams();
        this.closingResponseStreams();
        this._requestStreamPassThrough.destroy();
    }

    closingDetectStreams(){
        this.debug.log('CXUtils: half closing detect streams');
        if (this.detectStream && this.audioRequestStream) {
            this.detectStream.end();
            this.audioRequestStream.end();
        }
    }

    closingResponseStreams(){
        this.debug.log('CXUtils: half closing response streams');
        if (this._responseStreamPassThrough && this.audioResponseStream) {
            this._responseStreamPassThrough.end();
            this.audioResponseStream.end();
        }
    }

    getLengthOfWAV(fileSize, sampleRate, bitDepth, channels) {
        return Math.round(fileSize / sampleRate / bitDepth * 8 / channels * 1000);
    }
}