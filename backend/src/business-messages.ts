
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

import { DialogflowV2Beta1, DialogflowV2Beta1Stream } from './dialogflow-v2beta1';
import { DialogflowCX } from './dialogflow-cx';
import { DialogflowCXV3Beta1 } from './dialogflow-cxv3beta1';
import { MyPubSub } from './pubsub';
import * as uuid from 'uuid';

const { GoogleAuth } = require('google-auth-library');
const businessmessages = require('businessmessages');

// Initialize the Business Messages API
const bmApi = new businessmessages.businessmessages_v1.Businessmessages({});

// Set the scope for API authentication
const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/businessmessages',
});

export class BusinessMessages {
    private pubsub: MyPubSub;
    private dialogflow: any;
    public config: any;
    public debug: any;

    constructor(global) {
        this.config = global;
        this.debug = global.debugger;
        const df = global.dialogflow['version'] || 'v2beta1';
        if(df === 'cx') {
            this.dialogflow = new DialogflowCX(global);
        } else if(df === 'cxv3beta1') {
            this.dialogflow = new DialogflowCXV3Beta1(global);
        } else {
            this.dialogflow = new DialogflowV2Beta1Stream(global);
        }

        this.pubsub = new MyPubSub(global);
    }

    async handleInboundMessage(query: string, conversationId: string, lang?: string, contexts?: Array<string>) {
        const businessMessagesResponse = await this.dialogflow.detectIntentText(query, lang, contexts);
        businessMessagesResponse.platform = 'business-messages';
        this.pubsub.pushToChannel(businessMessagesResponse);

        const msg = businessMessagesResponse.responseMessages[0].text.text[0];

        // Respond with default fullfillment message
        this.sendResponse({
            messageId: uuid.v4(),
            representative: this.getRepresentative(),
            text: msg,
          }, conversationId);
    }

    async sendResponse(messageObject, conversationId) {
        let authClient = await auth.getClient();

        // Create the payload for sending a typing started event
        let apiEventParams = {
            auth: authClient,
            parent: 'conversations/' + conversationId,
            resource: {
                eventType: 'TYPING_STARTED',
                representative: this.getRepresentative(),
            },
            eventId: uuid.v4(),
        };

        // Send the typing started event
        bmApi.conversations.events.create(apiEventParams,
            {auth: authClient}, (err, response) => {
            let apiParams = {
                auth: authClient,
                parent: 'conversations/' + conversationId,
                resource: messageObject,
            };

            // Call the message create function using the
            // Business Messages client library
            bmApi.conversations.messages.create(apiParams,
                {auth: authClient}, (innerError, innerResponse) => {
                // Update the event parameters
                apiEventParams.resource.eventType = 'TYPING_STOPPED';
                apiEventParams.eventId = uuid.v4();

                // Send the typing stopped event
                bmApi.conversations.events.create(apiEventParams, {auth: authClient});
            });
        });
    }

    getRepresentative() {
        return {
            representativeType: 'Bot',
            displayName: 'G-Mortgages',
        };
    }
}
