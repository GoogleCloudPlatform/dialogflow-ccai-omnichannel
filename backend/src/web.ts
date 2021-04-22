
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

import { Transform } from 'stream';

const df = global.dialogflow['version'] || 'v2beta1';

export class Web {
    private pubsub: MyPubSub;
    private dialogflow: any;
    private streamRequest: any;
    private streamOutput: any;

    constructor() {
        if(df === 'cx') {
            this.dialogflow = new DialogflowCX();
        } else if(df === 'cxv3beta1') {
            this.dialogflow = new DialogflowCXV3Beta1();
        } else {
            this.dialogflow = new DialogflowV2Beta1Stream();
        }
        this.pubsub = new MyPubSub();

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

    async detectIntentText(query: string, lang?: string, contexts?: Array<string>) {
        const webResponse = await this.dialogflow.detectIntentText(query, lang, contexts);
        webResponse.platform = 'web';
        this.pubsub.pushToChannel(webResponse);
        return this.createRichMessages(webResponse);
    }
    async detectIntentEvent(eventName: string, lang?: string, params?: Array<string>) {
        const webResponse = await this.dialogflow.detectIntentEvent(eventName, lang, params);
        webResponse.platform = 'web';
        this.pubsub.pushToChannel(webResponse);
        return this.createRichMessages(webResponse);
    }
    async detectIntentAudioStream(stream: any, lang?: string) {
        const webResponse = await this.dialogflow.detectIntentText(stream, lang);
        webResponse.platform = 'web';
        this.pubsub.pushToChannel(webResponse);
        return this.createSSML(webResponse);
    }

    // TODO CREATE 2ND CLASS

    stream(ws: any): void{
        var dialogflowResponses;
        const dialogflow = new DialogflowV2Beta1Stream();

        var ArrayBufferView = Object.getPrototypeOf(Object.getPrototypeOf(new Uint8Array())).constructor;
        function isArrayBufferView(value) {
            return value instanceof ArrayBufferView;
        }

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
        const mediaStream = websocketStream(ws, {
            binary: false
        });

        // const dialogflowService = new DialogflowService();
        mediaStream.on('data', data => {
            // debug.log(data); // <-- I am not so sure if this is the correct data we pass in.
            if (isArrayBufferView(data)) {
                const stream = this.dialogflow.startPipeline(
                    this.streamRequest, this.streamOutput,
                    this.createAudioResponseStream, this.createAudioRequestStream);
                stream.write(data);
            }
        });
    }

    // this is the await pump part
    // https://github.com/googleapis/nodejs-dialogflow/blob/master/samples/detect.js
    createAudioResponseStream() {
        /*return new Transform({
            objectMode: true,
            transform: (chunk, encoding, callback) => {
            if (!chunk.outputAudio || chunk.outputAudio.length === 0) {
                return callback();
            }
            // Convert the LINEAR 16 Wavefile to 8000/mulaw
            const wav = new WaveFile();
            wav.fromBuffer(chunk.outputAudio);
            wav.toSampleRate(8000);
            wav.toMuLaw();
            return callback(null, Buffer.from(wav.getSamples()));
            },
        });*/
    }
        // this is the await pump part
    // https://github.com/googleapis/nodejs-dialogflow/blob/master/samples/detect.js
    createAudioRequestStream() {
        /*return new Transform({
            objectMode: true,
            transform: (chunk, encoding, callback) => {
            console.log(chunk); // TODO <--- and this is were Web breaks
            const msg = JSON.parse(chunk.toString('utf8'));
            // Only process media messages
            if (msg.event !== 'media') return callback();
            // This is mulaw/8000 base64-encoded
            return callback(null, { inputAudio: msg.media.payload });
            },
        });*/
    }
}

module.exports = {
    Web
};