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
import { debug } from './debug';

import * as df from '@google-cloud/dialogflow-cx';
import * as uuid from 'uuid';

import { BotResponse } from './dialogflow-bot-responses';

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

export class DialogflowCX {
    protected sessionClient: df.SessionsClient | df.v3beta1.SessionsClient;
    private projectId: string;
    private agentId: string;
    private location: string;
    private sessionId: string;
    private sessionPath: string;

    constructor() {
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

    detectIntentText(query: string, lang = global.dialogflow['language_code'], contexts?: Array<string>) {
        const qInput:QueryInputCX = {
            text: {
                text: query,
            },
            languageCode: lang
        };

        return this.detectIntent(qInput, query, contexts);
    }

    detectIntentEvent(eventName: string, lang = global.dialogflow['language_code']) {
        const qInput:QueryInputCX = {
            event: {
                event: eventName,
            },
            languageCode: lang
        };

        return this.detectIntent(qInput, eventName);
    }

    detectIntentAudioStream(stream, lang = global.dialogflow['language_code']){
        const qInput:QueryInputCX = {
            audio: {
                config: {
                    audioEncoding: global.dialogflow['encoding'],
                    sampleRateHertz: global.dialogflow['sample_rate_hertz'],
                }
            },
            languageCode: lang
        };

        return this.detectIntent(qInput, 'audio');
    }

    async detectIntent(qInput:QueryInputCX, input?: string, contexts?: Array<string>) {
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
            debug.log(response);
            botResponse = this.beautifyResponses(response, input);
        } catch(e) {
            debug.error(e);
            botResponse = this.beautifyResponses(null, input, e);
        }
        debug.log(botResponse);
        return botResponse;
    }

    beautifyResponses(response: any, input: string, e?: any): BotResponse{
        var botResponse: BotResponse;
        const dialogflowConfig = {
            sessionId: this.sessionId,
            sessionPath: this.sessionPath,
            projectId: this.projectId,
            agentId: this.agentId,
            location: this.location,
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
                currentPage: response.queryResult.currentPage,
                query: response.queryResult.query,
                text: response.queryResult.text, // override
                responseMessages: response.queryResult.responseMessages,
                webhookPayloads: response.queryResult.webhookPayloads,
                webhookStatuses: response.queryResult.webhookStatuses,
                outputAudio: response.outputAudio,
                responseId: response.responseId
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
                            intentDetectionConfidence: response.queryResult.intentDetectionConfidence
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

module.exports = {
    DialogflowCX
}