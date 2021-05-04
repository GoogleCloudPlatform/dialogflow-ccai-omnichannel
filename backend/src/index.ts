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
import { Web, WebStream } from './web';
import { ContactCenterAi } from './ccai';


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
    public debug: any;

    constructor() {
        this.web = new Web(global);
        this.webStream = new WebStream(global);
        this.ccai = new ContactCenterAi(global);
        this.aog = new Aog(global);
        this.debug = global.debugger;

        this.createApp();
        this.listen();
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

        this.app.engine('hbs', hbs());
        this.app.set('view engine', 'hbs');

        this.app.use(function(req: any, res: any, next: any) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            next();
        });

        var me = this;
        this.app.get('/api/web/', function(req, res) {
            res.json({ success: true, vertical: global.vertical, twilio: `+${global.twilio['phone_number']}`});
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

            ws.on('message', async (msg) => {
                const clientObj = JSON.parse(msg);
                this.debug.log(msg);

                switch(Object.keys(clientObj)[0]) {
                    case 'web-text-message':
                        var text = clientObj['web-text-message'];
                        dialogflowResponses = await this.web.detectIntentText(text);
                        ws.send(JSON.stringify(dialogflowResponses)); // TODO THIS NEEDS TO BE FIXED
                      break;
                    case 'web-event':
                        var eventName = clientObj['web-event'];
                        dialogflowResponses = await this.web.detectIntentEvent(eventName);
                        ws.send(JSON.stringify(dialogflowResponses));
                      break;
                    case 'disconnect':
                        // TODO?
                        break;
                    default:
                        this.debug.log('not a web-text-message or web-event');
                }
            });
        });
        this.app.ws('/api/web-audio/', (ws, req) => {
            me.debug.log('ws audio connected');
            me.webStream.stream(ws);
        });

        // Twilio Start Routes
        this.app.post('/api/sms/', async function(req, res){
            const body = req.body;
            const query = body.Body;
            const phoneNr = body.From;
            // const phoneNrCountry = body.FromCountry
            await me.ccai.sms(query, phoneNr, function(data){
                res.json(data);
            });

            // TODO this will be part from the flow
            // and a fulfillment function in Dialogflow will trigger this
            // route with a Body
            // will this be part of the Dialogflow conversation
            // or stored elsewhere?
        });
        this.app.post('/api/callme/', async function(req, res){
            const body = req.body;
            // const name = body.Name;
            const phoneNr = body.From;
            const protocol = req.secure? 'https://' : 'http://';
            const host = protocol + req.hostname;
            // get param phoneNr required
            if(phoneNr){
                await me.ccai.streamOutbound(phoneNr, host, function(data){
                    res.json(data);
                });
            } else {
                res.status(500);
            }
        });
        this.app.post('/api/twiml/', (req, res) => {
            // this is the route you configure your HTTP POST webhook in the Twilio console to.
            res.setHeader('Content-Type', 'text/xml');
            // ngrok sets x-original-host header
            const host = req.headers['x-original-host'] || req.hostname;
            me.debug.log('Call started: ' + host);
            // res.render('twiml', { host, layout: false });
            res.send(`<Response>
                <Connect>
                    <Stream url="wss://${host}/api/phone/"></Stream>
                </Connect>
            </Response>`);
        });
        // Twilio Ws Media Stream Route
        this.app.ws('/api/phone/', (ws, req) => {
            me.debug.log('ws phone connected');
            me.ccai.stream(ws);
        });

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