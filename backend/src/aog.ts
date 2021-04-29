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

import * as actionsSdk from 'actions-on-google';
import { DialogflowV2Beta1 } from './dialogflow-v2beta1';
import { DialogflowCX } from './dialogflow-cx';
import { DialogflowCXV3Beta1 } from './dialogflow-cxv3beta1';
import { MyPubSub } from './pubsub';

export class Aog {
    private pubsub: MyPubSub;
    private assistant: any;
    private dialogflow: DialogflowCX | DialogflowCXV3Beta1 | DialogflowV2Beta1;
    public config: any;
    public debug: any;

    constructor(global) {
        const df = global.dialogflow['version'] || 'v2beta1';
        this.config = global;
        this.debug = global.debugger;

        this.assistant = actionsSdk.actionssdk();
        if(df === 'cx') {
            this.dialogflow = new DialogflowCX(global);
        } else if(df === 'cxv3beta1') {
            this.dialogflow = new DialogflowCXV3Beta1(global);
        } else {
            this.dialogflow = new DialogflowV2Beta1(global);
        }
        this.pubsub = new MyPubSub(global);
    }

    /**
     * Register handlers for Actions SDK intents
     */
    registerHandlers(expressApp): void{
        this.assistant.intent('actions.intent.MAIN', async (conv) => {
            return this.detectIntentEvent(conv, 'WELCOME');
        });

        this.assistant.intent('actions.intent.TEXT', async (conv, input) => {
            if (input === 'bye' || input === 'goodbye') {
                // TODO get this from the Dialogflow end
                return conv.close('See you later!');
            }
            // Pass everything to Dialogflow
            this.debug.log(input);
            return this.detectIntentText(conv, input)
        });

        expressApp.post('/aog/', this.assistant)
    }

    createRichMessages(conv, response){
        const msg = response.responseMessages[0].text.text[0];
        conv.ask(msg);
    }

    async detectIntentEvent(conv: any, eventName: string){
        const aogResponse = await this.dialogflow.detectIntentEvent(eventName);
        aogResponse.platform = 'googleassistant';
        this.pubsub.pushToChannel(aogResponse);
        return this.createRichMessages(conv, aogResponse);
    }

    async detectIntentText(conv: any, query: string) {
        const aogResponse = await this.dialogflow.detectIntentText(query);
        aogResponse.platform = 'googleassistant';
        this.pubsub.pushToChannel(aogResponse);
        return this.createRichMessages(conv, aogResponse);
    }
}

module.exports = {
    Aog
}