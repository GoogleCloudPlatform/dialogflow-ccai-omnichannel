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
var df;
const Twilio = require('twilio');

export class TwilioIntegration {
    private pubsub: MyPubSub;
    private dialogflow: any;
    private twilio: any;
    public config: any;
    public devConfig: any;
    public debug: any;

    constructor(global) {
      this.config = global;
      this.devConfig = this.config.devConfig;
      this.debug = global.debugger;
      df = this.config.dialogflow['version'] || 'v2beta1';
      if(df === 'cx') {
          this.dialogflow = new DialogflowCXStream(global);
      } else if(df === 'cxv3beta1') {
          this.dialogflow = new DialogflowCXV3Beta1Stream(global);
      } else {
          this.dialogflow = new DialogflowV2Beta1Stream(global);
      }
      this.pubsub = new MyPubSub(global);

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
          this.debug.traceError('twilio.ts', 'Twilio: Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console. Exiting');
          return;
        }
        this.debug.error(err);
      }
    }

    async sms(query:string, user:any, cb){
      const me = this;
      me.debug.log(user);
      const botResponse = await this.dialogflow.detectIntentEvent(query, {
        user: user.uid,
        country: user.country
      });

      if(user){
        // Message to Recipient
        var msg = botResponse.fulfillmentText;
        msg = msg.replace('[NAME]', user.displayName);
        msg = msg.replace('[TIMESLOT]', user.timeslot);
        // Make sure you add the line breaks into CX
        // You can do this by writing the text in an editor first and
        // then copy it with the linebreaks to CX

          // https://www.twilio.com/docs/sms/send-messages
          me.twilio.messages.create(
            {
              to: user.phoneNumber,
              from: me.config.bot['phone_number'],
              body: msg
            }).then(function(message){
              botResponse.platform = 'sms';
              var data = {...botResponse, ...user};
              me.pubsub.pushToChannel(data);
              me.debug.log(message);
              cb({ success: true, message});
            }).catch(function(error){
              me.debug.error(error);
              cb({ success: false, error });
            });
      }
   }

   async streamOutboundDev(user:any, host, cb){
     const me = this;
     this.twilio.calls
     .create({
       // record: true,
       url: `${host}/api/twiml/`,
       to: user.phoneNumber,
       from: me.devConfig.bot['phone_number']
     })
     .then(function(call){
       cb({ success: true, call});
     }).catch(function(error){
       cb({ success: false, error });
     });
   }

    async streamOutbound(user:any, host: string, cb){
      const me = this;

      // Register the call with Verified Calls
      await this.registerVCall(me.config.bot['phone_number'], user.phoneNumber);

      this.twilio.calls
        .create({
          // record: true,
          url: `${host}/api/twiml/`,
          to: user.phoneNumber,
          from: me.config.bot['phone_number']
        })
        .then(function(call){
          // current time + 2 seconds, so it will be logged right after the web request.
          var timeNow = new Date();
          timeNow.setSeconds(timeNow.getSeconds() + 2);
          me.pubsub.pushToChannel({
            sessionId: 'twilio-outbound',
            sessionPath: 'twilio-outbound',
            vertical: me.config.vertical,
            tool: me.config.dialogflow['version'],
            uid: user.uid,
            country: user.country,
            dateTimeStamp: timeNow.toISOString(),
            platform: 'phone-outbound',
            languageCode: me.config.dialogflow['language_code'],
            intentDetection: {
              intent: {
                parameters: {
                  actions: this.config.twilio['welcome_event']
                }
              }
            }
          });
          cb({ success: true, call});
        }).catch(function(error){
          me.pubsub.pushToChannel({
            sessionId: 'twilio-outbound',
            sessionPath: 'twilio-outbound',
            uid: user.uid,
            country: user.country,
            vertical: me.config.vertical,
            tool: me.config.dialogflow['version'],
            dateTimeStamp: new Date().toISOString(),
            platform: 'phone-outbound',
            languageCode: me.config.dialogflow['language_code'],
            error,
            intentDetection: {
              intent: {
                parameters: {
                  actions: this.config.twilio['welcome_event']
                }
              }
            }
          });
          cb({ success: false, error });
        });
    }

    stream(ws, req){
        // This will get populated on callStarted
        let callSid;
        let streamSid;
        var previousBotResponse = null;

        // MediaStream coming from Twilio
        var mediaStream = websocketStream(ws, {
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
          sampleRateHertz: this.config.twilio['tts_sample_rate_hertz'],
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


        // EVENT LISTENERS

        // 1) Kick off the Dialogflow Integration, we will start the pipeline with a welcome event
        mediaStream.on('data', data => {
          this.dialogflow.send(data, queryInputObj, welcomeEvent, outputAudioConfig);
        });

        // 2) The Call Started we will get the call ID and stream ID
        this.dialogflow.on('callStarted', function(data){
          var me = this;
          me.debug.log('call started');
          callSid = data.callSid;
          streamSid = data.streamSid;
        });

        // 3) The Dialogflow integration received audio from Dialogflow CX (TTS)
        // We will need to return this to the Twilio call.
        this.dialogflow.on('audio', audio => {
          const mediaMessage = {
            streamSid,
            event: 'media',
            media: {
              payload: audio
            }
          };
          const mediaJSON = JSON.stringify(mediaMessage);
          this.debug.trace('twilio.ts', `Sending audio (${audio.length} characters)`);
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
            this.debug.trace('twilio.ts', 'Sending end of endOfInteraction mark', markJSON);
            mediaStream.write(markJSON);
          } else {
            // send mark to get notification of end of media
            // audio event
            const markMessage = {
              streamSid,
              event: 'mark',
              mark: {
                name: 'endOfTurnMediaPlayback'
              }
            };
            const markJSON = JSON.stringify(markMessage);
            this.debug.trace('twilio.ts', 'Sending end of endOfTurnMediaPlayback mark', markJSON);
            mediaStream.write(markJSON);
          }
        });

        this.dialogflow.on('interrupted', transcript => {
            if (!this.dialogflow.isInterrupted) {
              this.debug.trace('twilio.ts', 'Clearing...');
              const clearMessage = {
                event: 'clear',
                streamSid
              };
              mediaStream.write(JSON.stringify(clearMessage));
              this.dialogflow.isInterrupted = true;
            }
        });

        this.dialogflow.on('botResponse', botResponse => {
          botResponse['platform'] = 'phone';
          this.debug.trace('twilio.ts', 'Bot Response: ', botResponse);
          console.log('----');
          console.log(botResponse);
          console.log('----');
          this.pubsub.pushToChannel(botResponse);
        });

      this.dialogflow.on('endTurn', queryResult => {
        // this.debug.trace('twilio.ts', 'endTurn event', queryResult);
        this.debug.trace('twilio.ts', 'total duration:', this.dialogflow.totalDuration);
        sleep(this.dialogflow.totalDuration).then((sleepResponse) => {
            return;
        });
      });

      this.dialogflow.on('endOfInteraction', (queryResult) => {
        // this.debug.trace('twilio.ts', 'Virtual Agent hangs up, end of call, endOfInteraction');
        // this.debug.trace('twilio.ts', `media-unified-cx/dialogflowService/endOfInteraction Event:
         // ${this.dialogflow.sessionId}} Interaction ended with query result:`, queryResult.responseMessages);
        const response = new Twilio.twiml.VoiceResponse();
        const url = process.env.END_OF_INTERACTION_URL;
        // TODO you could put logics here, to transfer calls etc, but we jsut hangup.
        response.hangup();
        const twimlConst = response.toString();
        return this.twilio
          .calls(callSid)
          .update({ twimlConst })
          .then(call =>
            this.debug.trace('twilio.ts', `Updated Call(${callSid}) with twiml: ${twimlConst}`)
          )
          .catch(err => this.debug.error(err));
      });

        // Customer hangs up: cleanup stream
        this.dialogflow.on('hangup', message => {
            this.debug.trace('twilio.ts', `media-unified-cx/dialogflowService/hangup Event. Customer hangs up the phone: `,
            this.dialogflow.sessionId);
            this.dialogflow.isInterrupted = true;
        });

        // Error in audio pipeline: error handling, you can comment this out if you don't want to handle this.
        this.dialogflow.on('pipelineError', error => {
            this.debug.error('twilio.ts', `media-unified-cx/dialogflowService/pipelineError Dialogflow CX Pipeline Error:`, error);
            this.dialogflow.isInterrupted = true;
        });

        mediaStream.on('error', (e) => {
          this.debug.traceError('twilio.ts', 'MediaStream had an error:', e);
          this.dialogflow.finish();
        });

        mediaStream.on('finish', () => {
          // TODO on my live server this gets triggered by Twilio code
          // and it's likely done by the websockets library.
          this.debug.trace('twilio.ts', 'MediaStream has finished');
          this.dialogflow.finish();
        });
    }

    async registerVCall(brandPhoneNumber: string, userPhoneNumber: string) {
      const { GoogleAuth } = require('google-auth-library');
      const got = require('got');

      let bizCallsAuth = new GoogleAuth({
        scopes: 'https://www.googleapis.com/auth/cloud-platform',
      });

      let authClient = await bizCallsAuth.getClient();

      // Initialize auth token
      await authClient.refreshAccessToken();
      let accessToken = await authClient.getAccessToken();

      if(userPhoneNumber.charAt(0) !== '+') userPhoneNumber = '+' + userPhoneNumber;

      let options = {
        method: 'POST',
        json: {
            brandNumber: brandPhoneNumber,
            deviceNumber: userPhoneNumber,
            callReason: 'Following up on your mortgage inquiry.',
        },
        responseType: 'json',
        headers: {
            Authorization: 'Bearer ' + accessToken.token,
        },
      };

      // Register the call, this will error if you have not registered with Verified Calls
      // or the userPhoneNumber does not support Verified Calls
      try {
        const response = await got('https://businesscalls.googleapis.com/v1:sendVcallVerification', options);
      } catch(e) {
        console.log(e);
      }
    }
}

module.exports = {
  TwilioIntegration
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}