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

import * as http from 'http';
import * as express from 'express';
import * as expressWs from 'express-ws';
import * as hbs from 'express-handlebars';
import * as cors from 'cors';

import { global } from './config';
import { Aog } from './aog';
import { BusinessMessages } from './business-messages';
import { Web, WebStream } from './web';
import { ContactCenterAi } from './twilio';
import * as fb from './firebase';


export class App {
    public static readonly PORT:number = global['node_port'];
    private expressApp: express.Application;
    private wsInstance: any;
    private app: any;
    private server: http.Server;
    private web: Web;
    private webStream: WebStream;
    private ccai: ContactCenterAi;
    private aog: Aog;
    private businessMessages: BusinessMessages;
    private firebase: fb.FirebaseUsers;
    public debug: any;

    constructor() {
        this.web = new Web(global);
        this.webStream = new WebStream(global);
        this.ccai = new ContactCenterAi(global);
        this.firebase = new fb.FirebaseUsers(global);
        this.aog = new Aog(global);
        this.businessMessages = new BusinessMessages(global);
        this.debug = global.debugger;

        this.createApp();
        // this.enrollDemoUsers();
        this.listen();
    }

    // testing purposes
    private getUser(): void {
        var me = this;
        this.firebase.getUser({ email: global.employee['live_agent_email'] })
        .then((userRecord) => {
            me.debug.log('Found user with this email');
            me.debug.log(userRecord);
        })
        .catch((error) => {
            me.debug.error(error);
        });
    }

    private getFunnelStep(step: number): string {
        var funnelMap = new Map();
        funnelMap.set(1, 'WELCOME'); // ADVERTISING
        funnelMap.set(2, 'APPOINTMENT_SCHEDULING');
        funnelMap.set(3, 'APPOINTMENT_CONFIRMED');
        funnelMap.set(4, 'SUPPLEMENTAL');
        funnelMap.set(5, 'SUMMARY');
        funnelMap.set(6, 'OUTBOUND_SUPPORT');
        funnelMap.set(7, 'END');
        return funnelMap.get(step);
    }

    private enrollDemoUsers(): void {
        // For demo usage of this system, we will add
        // two user accounts to the system. One for the
        // live agent, and one for the end user.
        // Other users could use the flow on the demo website.
        var me = this;
        this.firebase.createUser({
            phoneNumber: `+${global.employee['phone_number']}`,
            password: global.employee['pass'],
            displayName: global.employee['display_name'],
            disabled: false,
            email: global.employee['email'],
            emailVerified: true
        }).then((userRecord) => {
            // See the UserRecord reference doc for the contents of userRecord.
            me.debug.log('Successfully created new user:', userRecord.uid);
        })
        .catch((error) => {
            me.debug.error('employee:');
            me.debug.error(error);
        });
    }

    private createApp(): void {
        this.app = express();
        this.wsInstance = expressWs(this.app, null, {
            binary: false,
            perMessageDeflate: false
        });

        // var corsOptions = {
        //    origin: 'http://example.com',
        //    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
        // }

        this.app.use(cors());
        this.app.use(express.urlencoded({
            extended: true
        }));
        this.app.use(express.json());

        this.app.use('/robots.txt', function (req, res, next) {
            res.type('text/plain')
            res.send('User-agent: *\nDisallow: /');
        });

        this.app.engine('hbs', hbs());
        this.app.set('view engine', 'hbs');

        this.app.use(function(req: any, res: any, next: any) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            next();
        });

        var me = this;
        this.app.get('/api/web/', function(req, res) {
            res.json({
                success: true,
                vertical: global.vertical,
                twilio: global.employee['phone_number']
            });
        });
        this.app.get('/api/', function(req, res) {
            res.status(200).send('API OK');
        });
        this.app.get('/', function(req, res) {
            res.status(200).send('OK');
        });

        // Google Assistant Route & Handlers
        this.aog.registerHandlers(me.app);

        // Mobile Channel Route
        this.app.post('/api/mobile/', async function(req, res) {
            const text = req.body.msg;
            const responses = await me.web.detectIntentText(text);
            res.json({success: true, responses});
        });

        // Web Routes, Get & WebSockets
        this.app.get('/api/dialogflow/', async function(req, res) {
            const responses = await me.web.detectIntentText('test');
            res.json({success: true, responses});
        });
        this.app.ws('/api/web-chat/', (ws, req) => {
            me.debug.log('ws text connected');
            var dialogflowResponses;

            ws.onclose = function(e) {
                console.log('Socket is closed.');
            };
            ws.on('request', function(request) {
                // console.log('!!!!');
                // console.log(request.resourceURL.query);
            });
            ws.onerror = function(err) {
                console.error('Socket encountered error: ', err.message, 'Closing socket');
                ws.close();
            };
            ws.on('message', async (msg) => {
                const clientObj = JSON.parse(msg);
                const userId = clientObj['user'];
                const country = clientObj['country'];
                me.debug.log(msg);
                const contexts = [];
                const queryParameters = {};
                queryParameters['user'] = userId;
                queryParameters['country'] = country;
                contexts.push(queryParameters);

                switch(Object.keys(clientObj)[0]) {
                    case 'web-text-message':
                        var webObjectTextMsg = clientObj['web-text-message'];
                        dialogflowResponses = await this.web.detectIntentText(webObjectTextMsg, contexts);
                        ws.send(JSON.stringify(dialogflowResponses));
                      break;
                    case 'web-event':
                        var eventName = clientObj['web-event'];
                        var e = '';
                        if (eventName === 'INIT') {
                            // Set the event name based on the FUNNEL STEP
                            e = me.getFunnelStep(2); /// flows/714e1bfd-b510-40ea-817d-a6b76029089b/
                        }
                        dialogflowResponses = await this.web.detectIntentEvent(e, contexts);
                        ws.send(JSON.stringify(dialogflowResponses));
                      break;
                    case 'disconnect':
                        break;
                    default:
                        me.debug.log('not a web-text-message or web-event');
                }
            });
        });
        this.app.ws('/api/web-audio/', (ws, req) => {
            // me.debug.log('ws audio connected');
            me.webStream.stream(ws);
        });

        var me = this;

        // Business Messages Routes
        this.app.post('/api/business-messages/', async function(req, res) {
            const body = req.body;

            // Extract the message payload parameters
            let conversationId = body.conversationId;
            let messageId = body.requestId;
            let agentName = body.agent;
            let displayName = body.context.userInfo.displayName;

            // Parse the message or suggested response body
            if ((body.message !== undefined
                && body.message.text !== undefined) || body.suggestionResponse !== undefined) {
                let text = body.message !== undefined ? body.message.text: body.suggestionResponse.text;

                 // Log message parameters
                me.debug.log('conversationId: ' + conversationId);
                me.debug.log('displayName: ' + displayName);
                me.debug.log('text: ' + text);

                me.businessMessages.handleInboundMessage(text, conversationId, displayName, me.firebase);
            }

            res.sendStatus(200);
        });

        // Twilio Start Routes
        this.app.post('/api/sms/', async function(req, res){
            const body = req.body;
            const query = body.Body;
            const uid = body.Uid;

            var userRecord;
            if(body && body.From && body.FromCountry) {
                // when you start the flow directly by contacting the phonenumber
                // instead of the web interface
                userRecord = {};
                userRecord['phoneNumber'] = body.From;
                userRecord['country'] = body.FromCountry;
            } else if(uid){
                // the web interface has the user.uid stored in the DF conversation
                userRecord = await me.firebase.getUser({uid});
                me.debug.log(userRecord);
            }

            me.botPhoneRouter(userRecord['country'], userRecord.phoneNumber[0]);
            if(userRecord){
                await me.ccai.sms(query, userRecord, function(data){
                    res.json(data);
                });
            }
        });

        this.app.post('/api/callme/', async function(req, res){
            const body = req.body;
            const uid = body.Uid;

            console.log('------------callme-now');
            console.log(uid);
            console.log(body.From);
            console.log(body.FromCountry);

            var userRecord;
            if(body && body.From) {
                // when you start the flow directly by contacting the phonenumber
                // instead of the web interface
                userRecord = {};
                userRecord['phoneNumber'] = body.From;
                userRecord['country'] = body.FromCountry;
                if(body.Name) userRecord['displayName'] = body.Name;
                me.debug.log(userRecord);
            } else if(uid){
                // the web interface has the user.uid stored in the DF conversation
                userRecord = await me.firebase.getUser({uid});
                me.debug.log(userRecord);
            }

            const protocol = req.secure? 'https://' : 'http://';
            const host = protocol + req.hostname;

            // get param phoneNr required
            if(userRecord && userRecord.phoneNumber){
                me.botPhoneRouter(userRecord['country'], userRecord.phoneNumber[0]);
                await me.ccai.streamOutbound(userRecord, host, function(data){
                    console.log(data);
                    res.json(data);
                });
            } else {
                res.status(500);
            }
        });

        // The endpoint set in the Twilio console
        this.app.post('/api/twiml/', async (req, res) => {
            const body = req.body;
            var userId = 'unknown';
            var userCountry = '';
            me.debug.log(body);
            if(body.Direction === 'inbound'){
                try {
                    var user = await me.firebase.getUser({phoneNumber: body.From });
                    userId = user.uid;
                    userCountry = body.fromCountry;
                    me.botPhoneRouter(userCountry, body.From[0]);
                } catch(e){
                    me.debug.error(e);
                }
            } else if(body.Direction === 'outbound-api'){
                try {
                    var user = await me.firebase.getUser({phoneNumber: body.To });
                    userId = user.uid;
                    userCountry = body.ToCountry;

                    me.botPhoneRouter(userCountry, body.To[0]);
                } catch(e){
                    me.debug.error(e);
                }
            }
            me.debug.log(userId);
            // this is the route you configure your HTTP POST webhook in the Twilio console to.
            res.setHeader('Content-Type', 'text/xml');
            // ngrok sets x-original-host header
            const host = req.headers['x-original-host'] || req.hostname;
            me.debug.log('Call started: ' + host);
            res.send(`<Response>
                <Connect>
                    <Stream url="wss://${host}/api/phone/">
                        <Parameter name="userId" value ="${userId}"/>
                        <Parameter name="userCountry" value ="${userCountry}" />
                    </Stream>
                </Connect>
            </Response>`);
        });

        // Twilio Ws Media Stream Route
        this.app.ws('/api/phone/', (ws, req) => {
            // me.debug.log('ws phone connected');
            console.log(req.body);
            me.ccai.stream(ws, req);
        });


        this.app.post('/api/auth/register/', async function(req, res) {
            const body = req.body;
            const displayName = body.username;
            const email = body.email;
            const password = body.password;
            const phoneNumber = body.phoneNr;

            var userRecord = await me.firebase.createUser({
                email,
                password,
                phoneNumber,
                displayName,
                emailVerified: true,
                disabled: false
            }).then((u) => {
                // See the UserRecord reference doc for the contents of userRecord.
                me.debug.log('Successfully created new user:', u);
                res.json({
                    success: true,
                    msg: 'User has been created:' + u.uid
                });
            })
            .catch((error) => {
                me.debug.error(error);
                res.json({
                    success: false,
                    msg: error
                });
            });
        });
        this.app.post('/api/auth/login/', async function(req, res) {
            const body = req.body;
            const email = body.email;
            const password = body.password;

            // TODO test against password and work with JWT
            var userRecord = await me.firebase.getUser({
                email
            }).then((u) => {
                me.debug.log(u);
            })
            .catch((error) => {
                me.debug.error(error);
            });

            res.send('OK');
        });
        this.app.post('/api/auth/reset/', async function(req, res) {
            const body = req.body;
            const email = body.email;

            // Password reset email

            res.send('OK');
        });
    }

    private botPhoneRouter(userCountry, userCountryCode?): void {
        // if the end user is located in the US
        // an US employee (US Twilio number)
        // should handle the call / SMS
        // because Twilio blocks international
        // robocalls for American users
        // defaults to international employee
        if(userCountry === 'US' || userCountryCode === '1'){
            global.bot['phone_number'] = global.bot['bot_phone_number_us'];
        } else {
            global.bot['phone_number'] = global.bot['bot_phone_number'];
        }
    }

    private listen(): void {
        this.app.listen(App.PORT, () => {
            this.debug.log('Running chat server on port ' + App.PORT);
            this.debug.log('Project ID: ' + global['gc_project_id']);
        });
    }

    public getApp(): express.Application {
        return this.app;
    }
}

export let app = new App();