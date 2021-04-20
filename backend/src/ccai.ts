
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

import * as websocketStream from 'websocket-stream/stream';
import { DialogflowV2Beta1, DialogflowV2Beta1Stream } from './dialogflow-v2beta1';
import { DialogflowCX } from './dialogflow-cx';
import { DialogflowCXV3Beta1 } from './dialogflow-cxv3beta1';
import { MyPubSub } from './pubsub';

const Twilio = require('twilio');
const df = global.dialogflow['version'] || 'v2beta1';

export class ContactCenterAi {
    private pubsub: MyPubSub;
    private dialogflow: DialogflowCX | DialogflowCXV3Beta1 | DialogflowV2Beta1Stream;

    constructor() {
        if(df === 'cx') {
            this.dialogflow = new DialogflowCX();
        } else if(df === 'cxv3beta1') {
            this.dialogflow = new DialogflowCXV3Beta1();
        } else {
            this.dialogflow = new DialogflowV2Beta1Stream();
        }
        this.pubsub = new MyPubSub();
    }

    stream(ws: any): void{
        let client;
        try {
            client = new Twilio(global.twilio['account_sid'], global.twilio['auth_token'], {
                logLevel: 'debug'
            });
        } catch(err) {
            if (global.twilio['account_sid']) {
                debug.error('Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console');
                debug.log('Exiting');
            return;
            }
            debug.error(err);
        }
        // This will get populated on callStarted
        let callSid;
        let streamSid;
        // MediaStream coming from Twilio

        const mediaStream = websocketStream(ws, {
            binary: false
        });

        // const dialogflowService = new DialogflowService();
        const dialogflow = new DialogflowV2Beta1Stream();

        mediaStream.on('data', data => {
            // console.log(data);
            dialogflow.send(data);
        });

        mediaStream.on('finish', () => {
            console.log('MediaStream has finished');
            dialogflow.finish();
            // this.pubsub.pushToChannel(aogResponse);
        });
    }

    createSSML(responses){
        // TODO
        return responses;
    }
}

module.exports = {
    ContactCenterAi
}