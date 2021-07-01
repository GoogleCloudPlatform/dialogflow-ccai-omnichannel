
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

import * as websocketStream from 'websocket-stream/stream';
import { DialogflowV2Beta1, DialogflowV2Beta1Stream } from './dialogflow-v2beta1';
import { DialogflowCX } from './dialogflow-cx';
import { DialogflowCXV3Beta1 } from './dialogflow-cxv3beta1';
import { MyPubSub } from './pubsub';

export class Web {
    private pubsub: MyPubSub;
    private dialogflow: any;
    private streamRequest: any;
    private streamOutput: any;
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

        this.streamRequest = {
            audioConfig: {
                audioEncoding: global.web['encoding'],
                sampleRateHertz: global.web['sample_rate_hertz'],
                languageCode: global.dialogflow['language_code'],
                singleUtterance: global.web['single_utterance'],
            },
            interimResults: false
        };

        this.streamOutput = {
            audioEncoding: null // TODO?
        }
    }

    createRichMessages(responses){
        // TODO
        return responses;
    }

    createSSML(responses){
        // TODO
        return responses;
    }

    async detectIntentText(query: string, contexts?: Array<any>) {
        const webResponse = await this.dialogflow.detectIntentText(query, contexts);
        webResponse.platform = 'web';
        this.pubsub.pushToChannel(webResponse);
        return this.createRichMessages(webResponse);
    }
    async detectIntentEvent(eventName: string, queryParams?: any) {
        const webResponse = await this.dialogflow.detectIntentEvent(eventName, queryParams);
        webResponse.platform = 'web';
        this.pubsub.pushToChannel(webResponse);
        return this.createRichMessages(webResponse);
    }
    /*async detectIntentAudioStream(stream: any) {
        const webResponse = await this.dialogflow.detectIntentText(stream);
        webResponse.platform = 'web';
        this.pubsub.pushToChannel(webResponse);
        return this.createSSML(webResponse);
    }*/
}

export class WebStream extends Web {
    public isFirst: boolean;

    constructor(global) {
      super(global);
    }

    stream(ws: any): void{

        /*
// Twilio
<Buffer 7b 22 65 76 65 6e 74 22 3a 22 6d 65
 64 69 61 22 2c 22 73 65 71 75 65 6e 63 65 4e 75 6d 62 65 72 22 3a 22 35 39 22 2c 22 6d 65 64 69 61 22 3a 7b 22 74 ... 327 more bytes>

// Web
Buffer(157568) [Uint8Array] [
    82,  73,  70, 70, 120, 103, 2, 0, 87, 65, 86, 69,
   102, 109, 116, 32,  16,   0, 0, 0,  1,  0,  1,  0,
   128,  62,   0,  0,   0, 125, 0, 0,  2,  0, 16,  0,
   100,  97, 116, 97,  84, 103, 2, 0,  0,  0,  0,  0,
     0,   0,   0,  0,   0,   0, 0, 0,  0,  0,  0,  0,
     0,   0,   0,  0,   0,   0, 0, 0,  0,  0,  0,  0,
     0,   0,   0,  0,   0,   0, 0, 0,  0,  0,  0,  0,
     0,   0,   0,  0,   0,   0, 0, 0,  0,  0,  0,  0,
     0,   0,   0,  0,
   ... 157468 more items
 ]
 // tslint:disable-next-line:max-line-length
 <Buffer 52 49 46 46 78 67 02 00 57 41 56 45 66 6d 74 2
 0 10 00 00 00 01 00 01 00 80 3e 00 00 00 7d 00 00 02 00 10 00 64 61 74 61 54 67 02 00 00 00 00 00 00 00 ... 157518 more bytes>
*/
        var dialogflowResponses;
        const dialogflow = new DialogflowV2Beta1Stream(global);

        var ArrayBufferView = Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor;
        function isArrayBufferView(value) {
            return value instanceof ArrayBufferView;
        }


        const mediaStream = websocketStream(ws, {
            binary: false
        });

        // const dialogflowService = new DialogflowService();
        mediaStream.on('data', data => {

        });

    }
}
