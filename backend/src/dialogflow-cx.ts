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
            analyzeQueryTextSentiment: true, // enable sentiment on text queries
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

        var timeZone = {}
        timeZone['timeZone'] = this.config.dialogflow['timezone'];
        let session = {
            ...timeZone,
        };

        return this.detectIntent(qInput, 'audio', session);
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
            this.debug.trace('dialogflow-cx.ts', 'detectIntent botresponse: ', response);
            botResponse = this.beautifyResponses(response, routeInput);
        } catch(e) {
            this.debug.traceError('dialogflow-cx.ts', 'detectIntent botresponse error: ', e);
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
        // this.debug.trace('dialogflow-cx.ts', 'getSessionParam sessionParams: ', sessionParams);
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

    beautifyResponses(response: any, input: string, e?: any): BotResponse {
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
            this.debug.traceError('dialogflow-cx.ts', 'beautifyResponses: ', e);
            dialogflowConfig['error'] = e.message;
        }

        if(response && response.queryResult){

            var dialogflowResponses = {
                languageCode: response.queryResult.languageCode, // override
                sentiment: response.queryResult.sentimentAnalysisResult,
                currentPage: response.queryResult.currentPage,
                responseMessages: response.queryResult.responseMessages,
                webhookPayloads: response.queryResult.webhookPayloads,
                webhookStatuses: response.queryResult.webhookStatuses,
                outputAudio: response.outputAudio,
                responseId: response.responseId,
                tool: this.config.dialogflow['version'],
                vertical: this.config.vertical
            }

            if(response.queryResult.responseMessages[0] && response.queryResult.responseMessages[0].text){
                dialogflowResponses['fulfillmentText'] =  response.queryResult.responseMessages[0].text.text[0];
            }

            if(response.sessionInfo){
                // for phone calls the stream needs to set this
                // TODO same trick we need for FUNNEL_STEP
                dialogflowResponses['uid'] = response.sessionInfo.uid;
                dialogflowResponses['sessionInfo'] = response.sessionInfo;
            } else {
                // else get it from the session parameters
                var uid = this.getSessionParam(response.queryResult, 'user');
                var country = this.getSessionParam(response.queryResult, 'country');
                dialogflowResponses['uid'] = uid;
                dialogflowResponses['sessionInfo'] = {
                    uid,
                    country
                }
            }

            if (response.queryResult.transcript) {
                dialogflowResponses['query'] = response.queryResult.transcript;
            }
            else if (response.queryResult.trigger_event) {
                dialogflowResponses['query'] = response.queryResult.trigger_event;
            }
            else if (response.queryResult.trigger_intent) {
                dialogflowResponses['query'] = response.queryResult.trigger_intent;
            } else if(response.queryResult.text){
                dialogflowResponses['query'] = response.queryResult.text;
            } else {
                dialogflowResponses['query'] = '';
            }

            if(response.recognitionResult){
                dialogflowResponses['recognitionResult'] = response.recognitionResult;
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
            } else {
                const intentDetectionObj = {
                    intentDetection: {
                        intent: {
                            isFallback: true
                        }
                    }
                };
                dialogflowResponses = {...dialogflowResponses, ...intentDetectionObj }
            }

            botResponse = {...dialogflowConfig, ...dialogflowResponses }
        } else {
            botResponse = dialogflowConfig;
        }

        this.debug.trace('dialogflow-cx.ts', 'beautifyResponses botResponse: ', botResponse);
        return botResponse;
    }
}

export class DialogflowCXStream extends DialogflowCX {
    public isFirst: boolean; // is it the first turn in the conversation
    public isReady: boolean; // is ready for next conversation turn
    public isStopped: boolean; // isStopped = is the conversation stopped
    public isRequestAudio: boolean;
    public isBargeIn: boolean;
    public isInputAudioTriggered: boolean;
    public isInterrupted: boolean;
    public isOutboundCall: boolean;
    public audioResponseStream: Transform;
    public audioRequestStream: Transform;
    public detectStream: any;
    public finalQueryResult: any;
    public finalRecognitionResult: any;
    public userInfo: any;
    public inputAudioTriggerCounter: number;
    public inputAudioTriggerDuration: number;
    public inputAudioTriggerLevel: number;
    public noBargeInDuration: number;
    public ttsRateAdjustment: number;
    public totalDuration: number;
    private _requestStreamPassThrough: PassThrough;
    private _responseStreamPassThrough: PassThrough;

    constructor(global) {
      super(global);

      // State management
      this.isFirst = true;
      this.isReady = false;
      this.isStopped = false;
      this.isInterrupted = false;
      this.isBargeIn = false;
      this.ttsRateAdjustment = 0.0;

      // isRequestAudio depends on trigger start page
      // do you want the VA to start or the user
      // depends on outbound or inbound call
      this.isOutboundCall = false;
      if (this.isOutboundCall) {
        this.isRequestAudio = false;
      } else {
        this.isRequestAudio = true;
      }

      this.inputAudioTriggerLevel = 40; // number of chunks of audio that are silence
      this.inputAudioTriggerDuration = 20; // duration in chunks below trigger level, each chunk is 20ms
      this.inputAudioTriggerCounter = 0; // current counter
      this.isInputAudioTriggered = false;
    }

    send(message, queryInputObj, welcomeEvent:string, outputAudioConfig) {
      const stream = this.startPipeline(queryInputObj, welcomeEvent, outputAudioConfig);
      stream.write(message);
    }

    getFinalQueryResult() {
      if (this.finalQueryResult && this.finalQueryResult.intent) {
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

    getFinalRecognitionResult(){
        if (this.finalRecognitionResult) {
            const recognitionResult = {
                transcript: this.finalRecognitionResult.transcript,
                confidence: this.finalRecognitionResult.confidence,
                language: this.finalRecognitionResult.languageCode
            };
            return recognitionResult;
          } else {
            return null;
          }
    }

    setUserInfo(callSid, streamSid, uid, country){
        this.userInfo = {
            uid,
            country,
            callSid,
            streamSid,
        };
    }

    startPipeline(queryInputObj, welcomeEvent:string, outputAudioConfig) {
        if (!this.isReady && !this.isStopped) {
            if (!this.isFirst) {
                this.debug.trace('dialogflow-cx.ts', 'Streaming startPipeline !isFirst. If there are more pipelines open in the first go, close all.');
                this.closingDetectStreams();
            }

            // Generate the streams
            this._requestStreamPassThrough = new PassThrough({ objectMode: true });
            this.audioRequestStream = this.createAudioRequestStream();
            this.detectStream = this.createDetectStream(queryInputObj, welcomeEvent, outputAudioConfig);

            this._responseStreamPassThrough = new PassThrough({ objectMode: true });
            this.audioResponseStream = this.createAudioResponseStream();

            this.isInterrupted = false;
            this.isReady = true;
            this.isFirst = false; // after calling detectStream for the first time

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
                          this.debug.traceError('dialogflow-cx.ts', 'Streaming startPipeline pipline: handling CX API error code 3, shutting down pipeline');
                          this.stop();
                          this.finish();
                        }
                    } else {
                        this.debug.trace('dialogflow-cx.ts', 'Pipeline succeed. Close streams start next conv turn.');
                        this.closingDetectStreams();
                        this.closingResponseStreams();
                    }
                    this.isReady = false;
                }
            );

            this._requestStreamPassThrough.on('data', async (data) => {
                // At the start of the call, we can capture
                // the call ID, and the USER INFO
                // We will need to store this in a session parameter
                const msg = JSON.parse(data.toString('utf8'));
                var me = this;
                if (msg.event === 'start') {
                    me.debug.trace('dialogflow-cx.ts', 'startPipeline Captured call:', msg.start.callSid);
                    var sessionParams = {
                        callSid: msg.start.callSid,
                        streamSid: msg.start.streamSid,
                        userId: msg.start.customParameters.userId,
                        userCountry: msg.start.customParameters.userCountry
                    };
                    this.emit('callStarted', sessionParams);
                    me.setUserInfo(msg.start.callSid,
                        msg.start.streamSid,
                        msg.start.customParameters.userId,
                        msg.start.customParameters.userCountry)
                    me.debug.trace('dialogflow-cx.ts', 'startPipeline callStarted:', sessionParams);
                }

                if (msg.event === 'mark') {
                    if (msg.mark.name === 'endOfInteraction') {
                        this.emit('endOfInteraction', this.getFinalQueryResult());
                    } else if (msg.mark.name === 'endOfTurnMediaPlayback') {
                        // the audio played
                        // now you will have to finish this stream and go over to the next stream.
                        me.debug.trace('dialogflow-cx.ts',
                            'startPipeline _requestStreamPassThrough/data endOfTurnMediaPlayback mark:', msg.mark.name);

                        this.isReady = false; // get ready for the next turn

                        if (this.isStopped) {
                          this.emit('endOfInteraction', this.getFinalQueryResult());
                        }
                        // else set to listening
                        this.isRequestAudio = true;
                        // this.debug.trace('dialogflow-cx.ts', 'endOfTurnMediaPlayback isFirst:', this.isFirst);
                        // this.debug.trace('dialogflow-cx.ts', 'endOfTurnMediaPlayback isReady:', this.isReady);
                        // this.debug.trace('dialogflow-cx.ts', 'endOfTurnMediaPlayback isStopped:', this.isStopped);
                    }
                }
                if (msg.event === 'stop') {
                    // me.debug.trace('dialogflow-cx.ts', 'startPipeline _requestStreamPassThrough/data event call stopped.');
                }
                if (msg.event === 'media') {
                    // me.debug.trace('dialogflow-cx.ts', 'startPipeline _requestStreamPassThrough/data event media.');
                }
            });

            this._responseStreamPassThrough.on('data', async (data) => {
                var me = this;

                if (
                  data.recognitionResult &&
                  data.recognitionResult.transcript &&
                  data.recognitionResult.transcript.length > 0
                ) {
                  me.emit('interrupted', data.recognitionResult.transcript);
                  me.debug.trace('dialogflow-cx.ts',
                        'startPipeline _responseStreamPassThrough/data interrupted event, recognitionResult:',
                        data.recognitionResult.transcript);

                  me.isRequestAudio = false;
                  me.isInputAudioTriggered = true; // stop all audio triggers


                    if(data.recognitionResult.isFinal){
                        me.finalRecognitionResult = data.recognitionResult;
                    }

                }

                if (data.detectIntentResponse &&
                    data.detectIntentResponse.queryResult &&
                    data.detectIntentResponse.queryResult.currentPage) {

                    if (data.detectIntentResponse.queryResult.currentPage.displayName === 'End Session') {
                      // handle end session
                      me.debug.trace('dialogflow-cx.ts',
                      'startPipeline _responseStreamPassThrough/data Dialogflow CX points to End Session',
                        data.detectIntentResponse.queryResult.intent.displayName);

                      me.finalQueryResult = data.detectIntentResponse.queryResult;
                      me.stop();
                    } else {

                        // me.debug.trace('dialogflow-cx.ts',
                        // 'startPipeline _responseStreamPassThrough/data detectIntentResponse Text QueryResult:',
                        // data.detectIntentResponse.queryResult);
                        // me.debug.trace('dialogflow-cx.ts',
                          // 'startPipeline _responseStreamPassThrough/data detectIntentResponse outputAudio:',
                          // data.detectIntentResponse.outputAudio);

                      // the final response
                      // but you could also use the END SINGLE RESPONSE
                      if (data.detectIntentResponse.queryResult.responseMessages &&
                        data.detectIntentResponse.queryResult.responseMessages[0] &&
                        data.detectIntentResponse.queryResult.responseMessages[0].text &&
                        data.detectIntentResponse.queryResult.responseMessages[0].text.text) {

                        // me.debug.trace('dialogflow-cx.ts',
                        //    'startPipeline _responseStreamPassThrough/data intermediate responses:',
                        //    data.detectIntentResponse.queryResult.responseMessages[0].text.text);

                        me.finalQueryResult = data.detectIntentResponse.queryResult;

                        try {
                            // detected an intent, so lets log it.
                            var bR = data.detectIntentResponse;
                            bR['recognitionResult'] = me.getFinalRecognitionResult();
                            bR['sessionInfo'] = me.userInfo;
                            var botResponse = await this.beautifyResponses(bR, 'audio');
                            // TODO include sessionParams
                            // botResponse = {...botResponse, ...mergeObj};
                            me.debug.trace('dialogflow-cx.ts',
                            'botResponse', botResponse);
                            me.emit('botResponse', botResponse);
                        } catch(e){
                            this.debug.traceError('dialogflow-cx.ts', 'BotResponse Emit failed.', e);
                        }

                      }

                      // calculate duration of audio to delay Telephony signalling
                      if (data.detectIntentResponse.outputAudio) {

                        me.noBargeInDuration = 0;
                        me.totalDuration = 0;

                        me.debug.trace('dialogflow-cx.ts',
                            'startPipeline _responseStreamPassThrough/data intermediate calculating audio playback time.');

                        me.noBargeInDuration =
                            me.getLengthOfWAV(Buffer.from(data.detectIntentResponse.outputAudio).length, me.config.twilio['tts_sample_rate_hertz'], 16, 1);
                        me.totalDuration =
                            me.getLengthOfWAV(Buffer.from(data.detectIntentResponse.outputAudio).length, me.config.twilio['tts_sample_rate_hertz'], 16, 1);

                        me.emit('endTurn', this.finalQueryResult);

                        me.debug.trace('dialogflow-cx.ts',
                            'startPipeline _responseStreamPassThrough/data computed noBargeInDuration', me.noBargeInDuration);
                        me.debug.trace('dialogflow-cx.ts',
                            'startPipeline _responseStreamPassThrough/data computed totalDuration', me.totalDuration);

                      }
                    }
                  }

                if (
                    data.queryResult &&
                    data.queryResult.intent &&
                    data.queryResult.intent.endInteraction
                    // TODO response.queryResult.responseMessages[0].endInteraction
                ) {
                    this.debug.trace('dialogflow-cx.ts',
                        `Ending interaction with:`, data.queryResult.fulfillmentText
                    );
                    this.finalQueryResult = data.queryResult;
                    this.stop();
                }
            });
            this.audioResponseStream.on('data', (data) => {
                var me = this;
                // TODO
                me.debug.trace('dialogflow-cx.ts', 'startPipeline audioResponseStream/data isStopped (should be false)', me.isStopped);
                me.debug.trace('dialogflow-cx.ts', 'startPipeline audioResponseStream/data isBargeIn', me.isBargeIn);
                if(!me.isStopped){
                    me.emit('audio', data.toString('base64'));
                }

                if (me.isBargeIn) {
                    me.isReady = false;
                }
            });

            this.audioResponseStream.on('error', (err) => {
                var me = this;
                me.debug.traceError('dialogflow-cx.ts', 'startPipeline audioResponseStream/error ignoring:', err);

                // handle error 3, need to shut down pipeline
                if (err === undefined) {
                  me.debug.traceError('dialogflow-cx.ts', 'startPipeline audioResponseStream/error Handling undefined error, shutting down pipeline');
                  this.stop();
                  this.finish();
                } else if (err['code'] && err['code'] === 3) {
                  me.debug.traceError('dialogflow-cx.ts', 'startPipeline audioResponseStream/error Handling CX API error code 3, shutting down pipeline');
                  this.stop();
                  this.finish();
                }
            });
        }
    return this._requestStreamPassThrough;
  }

    createDetectStream(queryInputObj, welcomeEvent:string, outputAudioConfig){
        var me = this;
        let queryInput = {};
        if (me.isFirst) {
            me.debug.trace('dialogflow-cx.ts', 'createDetectStream Welcome Event to trigger Dialogflow CX', welcomeEvent);
            queryInput['event'] = {
                event: welcomeEvent
            };
            queryInput['languageCode'] = me.config.dialogflow['language_code'];
        }

        queryInput = {...queryInput, ...queryInputObj }

        const initialStreamRequest = {
            queryInput,
            session: this.sessionPath,
            queryParams: {
                session: this.sessionPath,
                timeZone: this.config.dialogflow['timezone'],
                analyzeQueryTextSentiment: true, // enable sentiment on text queries
            },
            outputAudioConfig
        };

        const detectStream = me.sessionClient.streamingDetectIntent();
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

    processUpdatedTTSRate() {
        if (this.ttsRateAdjustment !== 0) {
          // set hard limits on ttsRateAdjustment
          if (this.ttsRateAdjustment + this.config.speakingRate > 4.0) {
            this.ttsRateAdjustment = 4.0;
          } else if (this.ttsRateAdjustment + this.config.twilio['speaking_rate'] < 0.25) {
            this.ttsRateAdjustment = 0.25;
          }
          this.config.twilio['speaking_rate'] = this.config.twilio['speaking_rate'] + this.ttsRateAdjustment;
        }
        this.debug.trace('twilio.ts', 'new TTS rate is:', this.config.twilio['speaking_rate']);
      }

    // processes input audio chunks to detect speech trigger
    processInputAudioChunk(chunk) {
        var count = (chunk.media.payload.match(/\//g) || []).length;
        // this.debug.trace('dialogflow-cx.ts', '_requestStream handler audio request chunk / count:', count);
        // this.debug.trace('dialogflow-cx.ts',
            // '_requestStream audio request chunk / inputAudioTriggerLevel:', this.inputAudioTriggerLevel);
        if (count < this.inputAudioTriggerLevel) {
            this.inputAudioTriggerCounter++;
            this.debug.trace('dialogflow-cx.ts', '_requestStream audio request chunk / update inputAudioTriggerCounter',
                 this.inputAudioTriggerCounter);
        }
        if (this.inputAudioTriggerCounter > this.inputAudioTriggerDuration) {
            this.isInputAudioTriggered = true;
            this.debug.trace('dialogflow-cx.ts', '_requestStream audio request chunk / update isInputAudioTriggered',
            this.isInputAudioTriggered);
        }
    }

    // detects and handles input audio trigger and resets counters and state
    updateInputAudioState() {
        this.debug.trace('dialogflow-cx.ts', 'updateInputAudioState isInputAudioTriggered', this.isInputAudioTriggered);
        if (this.isInputAudioTriggered) {
            this.debug.trace('dialogflow-cx.ts', 'updateInputAudioState Input Audio triggered, user utterance detected.');
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
        this.debug.trace('dialogflow-cx.ts', 'Stopping Dialogflow CX');
        this.isStopped = true;
    }

    finish() {
        this.debug.trace('dialogflow-cx.ts', 'Disconnecting Dialogflow CX and destroying streams');
        this.isStopped = true;
        this.isInterrupted = true;
        this.closingDetectStreams();
        this.closingResponseStreams();
        this._requestStreamPassThrough.destroy();
    }

    closingDetectStreams(){
        // this.debug.trace('dialogflow-cx.ts', 'Half closing detect streams');
        if (this.detectStream && this.audioRequestStream) {
            this.detectStream.end();
            this.audioRequestStream.end();
        }
    }

    closingResponseStreams(){
        // this.debug.trace('dialogflow-cx.ts', 'Half closing response streams');
        if (this._responseStreamPassThrough && this.audioResponseStream) {
            this._responseStreamPassThrough.end();
            this.audioResponseStream.end();
        }
    }

    getLengthOfWAV(fileSize, sampleRate, bitDepth, channels) {
        return Math.round(fileSize / sampleRate / bitDepth * 8 / channels * 1000);
    }
}