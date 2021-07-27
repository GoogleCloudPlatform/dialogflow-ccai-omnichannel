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
          this.debug.error('Ensure that you have set your environment variable TWILIO_ACCOUNT_SID. This can be copied from https://twilio.com/console');
          this.debug.log('Exiting');
          return;
        }
        this.debug.error(err);
      }
    }

    async sms(query:string, user:any, cb){
      const me = this;
      const botResponse = await this.dialogflow.detectIntentText(query);

      this.debug.log(user);

      if(user){

        // Message to Recipient
        var msg = botResponse.fulfillmentText;
        msg = msg.replace('[NAME]', user.displayName);

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

    async streamOutbound(user:any, host: string, cb){
      const me = this;
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
            uid: user.uid,
            country: user.country,
            dateTimeStamp: timeNow.toISOString(),
            platform: 'phone-outbound',
            languageCode: me.config.dialogflow['language_code'],
            intentDetection: {
              intent: {
                parameters: {
                  actions: 'OUTBOUND_SUPPORT'
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
            dateTimeStamp: new Date().toISOString(),
            platform: 'phone-outbound',
            languageCode: me.config.dialogflow['language_code'],
            error,
            intentDetection: {
              intent: {
                parameters: {
                  actions: 'OUTBOUND_SUPPORT'
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


        // EVENT LISTENERS

        this.dialogflow.on('callStarted', function(data){
          var me = this;
          me.debug.log('call started');
          callSid = data.callSid;
          streamSid = data.streamSid;
        });

        mediaStream.on('data', data => {
          this.dialogflow.send(data, queryInputObj, welcomeEvent, outputAudioConfig);
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
            this.debug.log('Sending end of interaction mark', markJSON);
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

        this.dialogflow.on('botResponse', botResponse => {
          botResponse['platform'] = 'phone';
          // this.debug.log('--------------- LOG THE RESPONSE');
          // this.debug.log(botResponse);
          // store first bot response
          if(previousBotResponse === null) previousBotResponse = botResponse;
          // only push to pubsub if there is a different timestamp
          // else we can assume it's the same
          // don't log messages that are the same
          const oldTime = new Date(previousBotResponse.dateTimeStamp).getTime();
          const newTime = new Date(botResponse.dateTimeStamp).getTime();
          // this.debug.log(newTime - oldTime);
          if((newTime - oldTime) > 1500){
            this.pubsub.pushToChannel(botResponse);
            previousBotResponse = null;
          }
        });

        // TODO THE END OF INTERACTION SHOULD DO SOMETHING SIMILAR BUT IN A CLOUD FUNCTION
        // SEE THE EXAMPLE https://github.com/twilio/media-streams/tree/master/node/dialogflow-integration
        // this.dialogflow.on('isHandOver', () => {
        //  const response = new Twilio.twiml.VoiceResponse();
        //  return response.dial(this.config.employee['phone_number']);
        // });

        // TODO
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

        // TODO
        mediaStream.on('error', (e) => {
          this.debug.log('MediaStream had an error');
          this.debug.error(e);
          this.dialogflow.finish();
        });

        mediaStream.on('finish', () => {
          this.debug.log('MediaStream has finished');
          this.dialogflow.finish();
        });
    }
}

module.exports = {
    ContactCenterAi
}