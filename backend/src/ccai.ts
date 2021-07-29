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
/*
import * as df from '../libs/dialogflow-v3alpha1-nodejs/src/v3alpha1';
import { BotResponse } from './dialogflow-bot-responses';
import * as uuid from 'uuid';
import { EventEmitter } from 'events';

export class CCAI extends EventEmitter {
    public conversationProfilesClient: df.;
    public conversationClient: df.ConversationsClient;
    public sessionClient: df.SessionsClient | df.SessionsClient;
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


        this.conversationProfilesClient = new df.ConversationProfilesClient();
        /*var conversationProfileRequest = {
            humanAgentSuggestionConfig: {
                featureConfigs: [
                {
                    suggestionFeature: {
                        type: 'DIALOGFLOW_ASSIST'
                    },
                    queryConfig: {
                        dialogflowQuerySource: {
                            agent: 'projects/project-id/agent'
                        }
                    },
                }]
            }
        };
        this.conversationProfilesClient.createConversationProfile({
            parent: `projects/${this.projectId}/locations/<Location ID>`
        });
    }
}*/