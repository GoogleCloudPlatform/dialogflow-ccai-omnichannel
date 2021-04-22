
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
    private dialogflow: any;

    constructor() {
         if(df === 'cx') {
             this.dialogflow = new DialogflowCX();
         } else if(df === 'cxv3beta1') {
             this.dialogflow = new DialogflowCXV3Beta1();
         } else {
             this.dialogflow = new DialogflowV2Beta1Stream();
         }
    }

    stream(ws){
        let client;
        try {
            client = new Twilio(global.twilio['account_sid'], global.twilio['auth_token'], {
                logLevel: 'debug'
            });
        } catch(err) {
          if (global.twilio['account_sid'] === undefined) {
            console.error('Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console');
            console.log('Exiting');
            return;
          }
          console.error(err);
        }
        // This will get populated on callStarted
        let callSid;
        let streamSid;
        // MediaStream coming from Twilio
        const mediaStream = websocketStream(ws, {
          binary: false
        });

        mediaStream.on('data', data => {
          this.dialogflow.send(data);
        });

        mediaStream.on('finish', () => {
          console.log('MediaStream has finished');
          this.dialogflow.finish();
        });

        this.dialogflow.on('callStarted', data => {
          callSid = data.callSid;
          streamSid = data.streamSid;
        });

        this.dialogflow.on('audio', audio => {
          const mediaMessage = {
            streamSid,
            event: 'media',
            media: {
              payload: audio
            }
          };
          const mediaJSON = JSON.stringify(mediaMessage);
          console.log(`Sending audio (${audio.length} characters)`);
          mediaStream.write(mediaJSON);
          // If this is the last message
          if (this.dialogflow.isStopped) {
            const markMessage = {
              streamSid,
              event: 'mark',
              mark: {
                name: 'endOfInteraction'
              }
            };
            const markJSON = JSON.stringify(markMessage);
            console.log('Sending end of interaction mark', markJSON);
            mediaStream.write(markJSON);
          }
        });

        this.dialogflow.on('interrupted', transcript => {
            console.log(`Interrupted with "${transcript}"`);
            if (!this.dialogflow.isInterrupted) {
              console.log('Clearing...');
              const clearMessage = {
                event: 'clear',
                streamSid
              };
              mediaStream.write(JSON.stringify(clearMessage));
              this.dialogflow.isInterrupted = true;
            }
        });

        this.dialogflow.on('endOfInteraction', (queryResult) => {
            const response = new Twilio.twiml.VoiceResponse();
            const url = process.env.END_OF_INTERACTION_URL;
            if (url) {
              const qs = JSON.stringify(queryResult);
              // In case the URL has a ?, use an ampersand
              const appendage = url.includes('?') ? '&' : '?';
              response.redirect(
                `${url}${appendage}dialogflowJSON=${encodeURIComponent(qs)}`
              );
            } else {
              response.hangup();
            }
            const twiml = response.toString();
            return client
              .calls(callSid)
              .update({ twiml })
              .then(call =>
                console.log(`Updated Call(${callSid}) with twiml: ${twiml}`)
              )
              .catch(err => console.error(err));
        });
    }
}

module.exports = {
    ContactCenterAi
}