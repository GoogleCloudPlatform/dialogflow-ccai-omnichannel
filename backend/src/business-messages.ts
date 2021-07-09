
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
import * as fb from './firebase';
import * as admin from 'firebase-admin';

const struct = require('./structjson');
const { GoogleAuth } = require('google-auth-library');
const businessmessages = require('businessmessages');

// Initialize the Business Messages API
const bmApi = new businessmessages.businessmessages_v1.Businessmessages({});

// Set the scope for API authentication
const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/businessmessages',
});

const BM_EMAIL_PROMPT_EVENT = 'BM_EMAIL_PROMPT';
const WELCOME_EVENT = 'APPOINTMENT_SCHEDULING';

export class BusinessMessages {
    private pubsub: MyPubSub;
    private dialogflow: any;
    private intentMap: any;
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

    async handleInboundMessage(query: string, conversationId: string, displayName: string,
        firebase: any, lang?: string) {
        let userObject = null;
        let dialogflowResponseObject = null;

        const snapshot = await this.getChannelMapping(conversationId);

        // User doesn't exist, create channel mapping and prompt for email
        if (snapshot.empty) {
            this.createChannelMapping(conversationId);

            // No user record existed, trigger the email prompt event
            dialogflowResponseObject = await this.dialogflow.detectIntentEvent(BM_EMAIL_PROMPT_EVENT,
                lang);
        }
        else { // Channel mapping exists
            userObject = await this.getUserFromSnapshot(snapshot, firebase);

            // No matching user, trigger email capture flow
            if(userObject == null || userObject.email === undefined) {
                dialogflowResponseObject = await this.handleEmailResponse(conversationId,
                    displayName, firebase, query, lang);
            }
            else {
                let contexts = [{user: userObject.uid}];
                dialogflowResponseObject = await this.dialogflow.detectIntentText(query, lang,
                    contexts);
            }
        }

        // Convert Dialogflow response into Business Messages response
        this.handleMessage(userObject, dialogflowResponseObject, conversationId);
    }

    async handleEmailResponse(conversationId: string, displayName: string,
        firebase: any, query: string, lang: string):Promise<any> {
        // Check query to see if the user provided their email address
        let dialogflowResponseObject = await this.dialogflow.detectIntentText(query, lang);

        // Check whether the current user query is an email address
        if(dialogflowResponseObject.intentDetection.intent.displayName === 'BM Email Prompt'
            && dialogflowResponseObject.intentDetection.intent.parameters.email) {
            // Extract the email from the Dialogflow parameters
            let userEmail = dialogflowResponseObject.intentDetection.intent.parameters.email;

            let userObject = null;
             try {
                userObject = await firebase.getUser({email: userEmail});
            } catch(e) {}

            if(userObject === null) {
                // Create user record
                userObject = await firebase.createUser({
                    email: userEmail, displayName
                });
            }

            this.updateChannelMapping(conversationId, userObject.uid);

            // Send thank you for providing an email
            this.handleMessage(userObject, dialogflowResponseObject, conversationId);

            // Trigger the welcome message to start the user journey
            return await this.dialogflow.detectIntentEvent(WELCOME_EVENT, lang);
        }
        else {
            // User does not have an email and didn't respond with one, so prompt for an email
            return await this.dialogflow.detectIntentEvent(BM_EMAIL_PROMPT_EVENT, lang);
        }
    }

    async getUserFromSnapshot(snapshot:any, firebase:any):Promise<any> {
        let userId = null;
        snapshot.forEach(doc => {
          userId = doc.data().uid;
        });

        let userObject = null;
        try {
            userObject = await firebase.getUser({uid: userId});
        } catch(e) {}

        return userObject;
    }

    async getChannelMapping(conversationId: string):Promise<any> {
        const db = admin.firestore();
        const ref = db.collection('channel_mappings');
        const snapshot = await ref.where('channelId', '==', conversationId).get();

        return snapshot;
    }

    async updateChannelMapping(conversationId: string, uid: string) {
        const db = admin.firestore();

        const snapshot = await this.getChannelMapping(conversationId);
        snapshot.forEach(doc => {
          doc.ref.update({
              uid
          })
        });
    }

    async createChannelMapping(conversationId: string) {
        const db = admin.firestore();

        // Create mapping fron conversationId to the Firebase user unique ID
        const docRef = db.collection('channel_mappings').doc('channel_mapping');
        await db.collection('channel_mappings').add({
          channelId: conversationId,
          channelType: 'business-messages'
        });
    }

    async handleMessage(userObject, dialogflowResponseObject, conversationId) {
        dialogflowResponseObject.platform = 'business-messages';

        var data = {...dialogflowResponseObject, ...userObject};
        this.pubsub.pushToChannel(data);

        // Create the default response based on fulfillmentText
        let botResponse = {
            text: dialogflowResponseObject.fulfillmentText,
            messageId: uuid.v4(),
            representative: this.getRepresentative()
        };

        let responseSatisifiedViaCustomPayload = false;

        // Use the custom payloads if they exist
        for (var responseMessage of dialogflowResponseObject.responseMessages) {
            // Only process custom payload fulfillment messages
            if (responseMessage.payload !== undefined) {
                let payload = struct.structProtoToJson(responseMessage.payload);
                let responseObject = payload.fulfillmentMessages[0].payload;

                responseObject.messageId = uuid.v4();
                responseObject.representative = botResponse.representative;

                // No fallback text, use the default text from Dialogflow
                if (responseObject.fallback === undefined) {
                    responseObject.fallback = dialogflowResponseObject.fulfillmentText;
                }

                // Respond to the user
                this.sendResponse(responseObject, conversationId);

                responseSatisifiedViaCustomPayload = true;
            }
        }

        // Send the default response if no custom payload was used
        if (!responseSatisifiedViaCustomPayload) {
            this.sendResponse(botResponse, conversationId);
        }
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
