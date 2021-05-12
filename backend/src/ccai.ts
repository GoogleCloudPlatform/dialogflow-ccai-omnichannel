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
import { DialogflowCX, DialogflowCXStream } from './dialogflow-cx';
import { DialogflowCXV3Beta1, DialogflowCXV3Beta1Stream } from './dialogflow-cxv3beta1';
import { MyPubSub } from './pubsub';
import { Transform } from 'stream';
import { WaveFile } from 'wavefile';

const Twilio = require('twilio');
var df;

export class ContactCenterAi {
    private pubsub: MyPubSub;
    private dialogflow: any;
    private twilio: any;
    public config: any;
    public debug: any;

    constructor(global) {
      this.config = global;
      this.debug = global.debugger;
      df = this.config.dialogflow['version'] || 'v2beta1';
      if(df === 'cx') {
          this.dialogflow = new DialogflowCXStream(global);
      } else if(df === 'cxv3beta1') {
          this.dialogflow = new DialogflowCXV3Beta1Stream(global);
      } else {
          this.dialogflow = new DialogflowV2Beta1Stream(global);
      }

      try {
          if(this.debug){
            this.twilio = new Twilio(global.twilio['account_sid'], global.twilio['auth_token'], {
                logLevel: 'debug'
            });
          } else {
            this.twilio = new Twilio(global.twilio['account_sid'], global.twilio['auth_token']);
          }
      } catch(err) {
        if (global.twilio['account_sid'] === undefined) {
          this.debug.error('Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console');
          this.debug.log('Exiting');
          return;
        }
        this.debug.error(err);
      }
    }

    async sms(query:string, phoneNr:string, cb){
      const me = this;
      const botResponse = await this.dialogflow.detectIntentText(query);

      // https://www.twilio.com/docs/sms/send-messages
      me.twilio.messages.create(
        {
          to: phoneNr, // Recipient's number
          from: me.config.twilio['phone_number'],
          body: botResponse.fulfillmentText // Message to Recipient
        }).then(function(message){
          // TODO PUBSUB
          me.debug.log(message);
          cb({ success: true, message});
        }).catch(function(error){
          me.debug.error(error);
          cb({ success: false, error });
        });
    }

    async streamOutbound(phoneNr:string, host: string, cb){
      const me = this;
      this.twilio.calls
        .create({
          // record: true,
          url: `${host}/api/twiml/`,
          to: phoneNr,
          from: me.config.twilio['phone_number']
        })
        .then(function(call){
          cb({ success: true, call});
        }).catch(function(error){
          cb({ success: false, error });
        });
    }

    stream(ws){
        // This will get populated on callStarted
        let callSid;
        let streamSid;
        // MediaStream coming from Twilio
        const mediaStream = websocketStream(ws, {
          binary: false
        });

        let welcomeEvent = this.config.twilio['welcome_event'];

        const queryInputObj = {};
        const synthesizeSpeechConfig = {
          speakingRate: this.config.twilio['speaking_rate'],
          pitch: this.config.twilio['pitch'],
          volumeGainDb: this.config.twilio['volume_gain_db'],
          voice: {
            name: this.config.twilio['voice_name'],
            ssmlGender: this.config.twilio['ssml_gender'],
          }
        };

        const outputAudioConfig = {
          audioEncoding: this.config.twilio['output_encoding'],
          synthesizeSpeechConfig
        };

        if(this.config.dialogflow['version'] === 'cx'){
          queryInputObj['audio'] = {
            config: {
              audioEncoding: this.config.twilio['input_encoding'],
              sampleRateHertz: this.config.twilio['sample_rate_hertz'],
              singleUtterance: this.config.twilio['single_utterance'],
              model: this.config.twilio['model'],
              modelVariant: this.config.twilio['model_variant']
            }
          };
          queryInputObj['languageCode'] = this.config.dialogflow['language_code'];
        } else {
          queryInputObj['audioConfig'] = {
            audioEncoding: this.config.twilio['input_encoding'],
            sampleRateHertz: this.config.twilio['sample_rate_hertz'],
            languageCode: this.config.dialogflow['language_code'],
            singleUtterance: this.config.twilio['single_utterance'],
            model: this.config.twilio['model'],
            modelVariant: this.config.twilio['model_variant']
          };
          queryInputObj['interimResults'] = this.config.twilio['interim_results'];
        }

        mediaStream.on('data', data => {
          this.dialogflow.send(data, this.createAudioResponseStream, queryInputObj, welcomeEvent, outputAudioConfig);
        });

        mediaStream.on('finish', () => {
          this.debug.log('MediaStream has finished');
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
          this.debug.log(`Sending audio (${audio.length} characters)`);
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
            // console.log('Sending end of interaction mark', markJSON);
            mediaStream.write(markJSON);
          }
        });

        this.dialogflow.on('interrupted', transcript => {
          this.debug.log(`Interrupted with "${transcript}"`);
            if (!this.dialogflow.isInterrupted) {
              this.debug.log('Clearing...');
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
            return this.twilio
              .calls(callSid)
              .update({ twiml })
              .then(call =>
                this.debug.log(`Updated Call(${callSid}) with twiml: ${twiml}`)
              )
              .catch(err => this.debug.error(err));
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
          if(df === 'cx'){
            if (!chunk.detectIntentResponse
              || !chunk.detectIntentResponse.outputAudio || chunk.detectIntentResponse.outputAudio.length === 0) {
              return callback();
            }
            wav.fromBuffer(chunk.detectIntentResponse.outputAudio);
          } else {
            if (!chunk.outputAudio || chunk.outputAudio.length === 0) {
              return callback();
            }
            wav.fromBuffer(chunk.outputAudio);
          }

          wav.toSampleRate(8000);
          wav.toMuLaw();
          return callback(null, Buffer.from(wav.data['samples']));
        },
      });
    }
}

module.exports = {
    ContactCenterAi
}