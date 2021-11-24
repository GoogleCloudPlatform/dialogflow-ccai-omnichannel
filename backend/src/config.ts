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

import * as dotenv from 'dotenv';
dotenv.config();

import { Debug } from './debug';

export interface GlobalConfig {
    development?: {
        config_id: string // 'development' || 'production'
        gc_project_id: string
        debug: boolean
        vertical: string // 'fsi' || 'health' || 'retail' || 'insurances'
        server_url: string // url or ngrok tunnel
        node_port?: number
        dialogflow: {
            version: string // 'cx' || 'cxv3beta1' || 'v2beta1'
            cx_agent_id?: string // UUID ID of agent
            cx_location?: string // 'global' || ... https://cloud.google.com/dialogflow/cx/docs/concept/region
            language_code: string // 'en-US' || ... https://cloud.google.com/dialogflow/cx/docs/reference/language
            timezone: string // 'Europe/Madrid' || 'America/New_York' ...
        },
        web?: {
            welcome_event?: string,
            encoding?: string, // 'AUDIO_ENCODING_LINEAR_16' ||
            // https://cloud.google.com/dialogflow/cx/docs/reference/rpc/google.cloud.dialogflow.cx.v3
            // #google.cloud.dialogflow.cx.v3.AudioEncoding
            sample_rate_hertz?: number // 16000 || 8000 || 44100 || 48000 ... https://cloud.google.com/speech-to-text/docs/basics
            single_utterance?: boolean
        },
        angular?: {
            angular_port: number
        }
        twilio?: {
            account_sid: string // .env Your Account SID from www.twilio.com/console
            auth_token: string // .env Your Auth Token from www.twilio.com/console
            input_encoding: string // 'AUDIO_ENCODING_MULAW',
            output_encoding: string // OUTPUT_AUDIO_ENCODING_LINEAR_16',
            sample_rate_hertz: number,
            single_utterance: boolean,
            interim_results: boolean,
            model_variant: string,
            model: string,
            welcome_event: string, // 'Welcome'
            speaking_rate: number // 1.0, // [0.25, 4.0] - 1 is normal, 2 is twice as fast
            pitch: number, // 1.0, /// Speaking pitch, in the range [-20.0, 20.0]. 20
            // means increase 20 semitones from the original pitch. -20 means decrease 20 semitones from the original pitch.
            volume_gain_db: number, // 0.0, // //Volume gain (in dB) of the
            // normal native volume supported by the specific voice, in the range [-96.0, 16.0].
            voice_name: string, // 'en-US-Standard-H', ////https://cloud.google.com/text-to-speech/docs/voices
            ssml_gender: string // 'SSML_VOICE_GENDER_FEMALE',
        },
        pubsub?: {
            topic_name: string
        },
        bigquery?: {
            database_name: string
            table_name: string
            columns: string
        },
        employee: {
            live_agent_phone_number?: string,
            live_agent_email?: string,
            live_agent_pass?: string,
            live_agent_display_name?: string
            live_agent_phone_number_us?: string,
            live_agent_email_us?: string,
            live_agent_pass_us?: string,
            live_agent_display_name_us?: string,
            phone_number?: string, // active phone number, can be live agent vs. live agent us
            email?: string,
            pass?: string,
            display_name?: string,
        },
        bot: {
            bot_phone_number?: string,
            bot_phone_number_us?: string,
            phone_number?: string
        }
    }
    production?: {
        config_id: string,
        debug: boolean,
        server_url: string
    }
}

const globalConfig: GlobalConfig = {
    development: {
        config_id: 'development',
        debug: true,
        gc_project_id: '.ENV',
        server_url: '.ENV',
        node_port: 8080,
        vertical: '.ENV',
        dialogflow: {
            version: 'cx', // 'v2beta1' || 'cx',
            cx_agent_id: '.ENV',
            cx_location: '.ENV',
            language_code: 'en-US',
            timezone: 'Europe/Madrid'
        },
        web: {
            encoding: 'AUDIO_ENCODING_LINEAR_16',
            sample_rate_hertz: 16000,
            single_utterance: false,
            welcome_event: 'APPOINTMENT_SCHEDULING',
        },
        pubsub: {
            topic_name: '.ENV'
        },
        twilio: {
            account_sid: '.ENV',
            auth_token: '.ENV',
            input_encoding: 'AUDIO_ENCODING_MULAW',
            output_encoding: 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
            sample_rate_hertz: 8000,
            single_utterance: true,
            interim_results: true,
            welcome_event: 'OUTBOUND_SUPPORT',
            speaking_rate: 1.0,
            pitch: 1.0,
            volume_gain_db: 0.0,
            voice_name: 'en-US-Wavenet-H',
            ssml_gender: 'SSML_VOICE_GENDER_FEMALE',
            model: 'phone_call',
            model_variant: 'USE_ENHANCED',
        },
        angular: {
            angular_port: 4200
        },
        employee: {
            live_agent_phone_number: '.ENV',
            live_agent_email: '.ENV',
            live_agent_pass: '.ENV',
            live_agent_display_name: '.ENV',
            live_agent_phone_number_us: '.ENV',
            live_agent_email_us: '.ENV',
            live_agent_pass_us: '.ENV',
            live_agent_display_name_us: '.ENV'
        },
        bot: {
            bot_phone_number: '.ENV',
            bot_phone_number_us: '.ENV',
        }

    },
    production: {
        config_id: 'production',
        debug: false,
        server_url: '.ENV'
    }
};

const defaultConfig = globalConfig.development;
const environment = process.env.npm_config_ENV || process.env.ENV || 'development';
const envConfig = globalConfig[environment];

// development is default, override production config
const finalConfig = {...defaultConfig, ...envConfig};

// These variables are secrets and can be passed in
// from the command-line or environment config stores
// it will override the config.json
const projectId = process.env.npm_config_GC_PROJECT_ID || process.env.GC_PROJECT_ID || envConfig.gc_project_id;
finalConfig.gc_project_id = projectId;

const serverUrl = process.env.npm_config_DOMAIN1 || process.env.DOMNAIN1 || envConfig.server_url;
finalConfig.server_url = serverUrl;

const pubsub = process.env.npm_config_PUBSUB_TOPIC || process.env.PUBSUB_TOPIC || envConfig.pubsub.topic_name;
finalConfig.pubsub.topic_name = pubsub;
const port = process.env.npm_config_PORT || process.env.PORT || envConfig.node_port;
finalConfig.node_port = port;
const vertical = process.env.npm_config_VERTICAL || process.env.VERTICAL || envConfig.vertical;
finalConfig.vertical = vertical;
const agentId = process.env.npm_config_AGENT_ID || process.env.AGENT_ID || envConfig.dialogflow.cx_agent_id;
finalConfig.dialogflow.cx_agent_id = agentId;
const cxLocation = process.env.npm_config_CX_LOCATION || process.env.CX_LOCATION || envConfig.dialogflow.cx_location;
finalConfig.dialogflow.cx_location = cxLocation;
const accountSid = process.env.npm_config_TWILIO_ACCOUNT_SID ||process.env.TWILIO_ACCOUNT_SID || envConfig.twilio.account_sid;
finalConfig.twilio.account_sid = accountSid;
const authToken = process.env.npm_config_TWILIO_ACCOUNT_TOKEN ||process.env.TWILIO_ACCOUNT_TOKEN || envConfig.twilio.auth_token;
finalConfig.twilio.auth_token = authToken;

const liveAgentPhoneNumber = process.env.npm_config_LIVE_AGENT_PHONE_NUMBER
|| process.env.LIVE_AGENT_PHONE_NUMBER || envConfig.employee.live_agent_phone_number;
finalConfig.employee.live_agent_phone_number = liveAgentPhoneNumber;
const liveAgentEmail = process.env.npm_config_LIVE_AGENT_EMAIL || process.env.LIVE_AGENT_EMAIL || envConfig.employee.live_agent_email;
finalConfig.employee.live_agent_email = liveAgentEmail;
const liveAgentPass = process.env.npm_config_LIVE_AGENT_PASS || process.env.LIVE_AGENT_PASS || envConfig.employee.live_agent_pass;
finalConfig.employee.live_agent_pass = liveAgentPass;
const liveAgentDisplayName = process.env.npm_config_LIVE_AGENT_DISPLAY_NAME
|| process.env.LIVE_AGENT_DISPLAY_NAME || envConfig.employee.live_agent_display_name;
finalConfig.employee.live_agent_display_name = liveAgentDisplayName;

const liveAgentPhoneNumberUS = process.env.npm_config_LIVE_AGENT_PHONE_NUMBER_US
|| process.env.LIVE_AGENT_PHONE_NUMBER_US || envConfig.employee.live_agent_phone_number_us;
finalConfig.employee.live_agent_phone_number_us = liveAgentPhoneNumberUS;
const liveAgentEmailUS = process.env.npm_config_LIVE_AGENT_EMAIL_US || process.env.LIVE_AGENT_EMAIL_US ||
envConfig.employee.live_agent_email_us;
finalConfig.employee.live_agent_email_us = liveAgentEmailUS;
const liveAgentPassUS = process.env.npm_config_LIVE_AGENT_PASS_US || process.env.LIVE_AGENT_PASS_US ||
 envConfig.employee.live_agent_pass_us;
finalConfig.employee.live_agent_pass_us = liveAgentPassUS;
const liveAgentDisplayNameUS = process.env.npm_config_LIVE_AGENT_DISPLAY_NAME_US
|| process.env.LIVE_AGENT_DISPLAY_NAME_US || envConfig.employee.live_agent_display_name_us;
finalConfig.employee.live_agent_display_name_us = liveAgentDisplayNameUS;

const botPhoneNumber = process.env.npm_config_BOT_PHONE_NUMBER
|| process.env.BOT_PHONE_NUMBER || envConfig.bot.bot_phone_number;
finalConfig.bot.bot_phone_number = botPhoneNumber;
const botPhoneNumberUS = process.env.npm_config_BOT_PHONE_NUMBER_US
|| process.env.BOT_PHONE_NUMBER_US || envConfig.bot.bot_phone_number_us;
finalConfig.bot.bot_phone_number_us = botPhoneNumberUS;

// the active employee will be routed based on location, in index.ts
// default to international employee
finalConfig.employee.phone_number = finalConfig.employee.live_agent_phone_number;
finalConfig.employee.email = finalConfig.employee.live_agent_email;
finalConfig.employee.pass = finalConfig.employee.live_agent_pass;
finalConfig.employee.display_name = finalConfig.employee.live_agent_display_name;

// the active employee will be routed based on location, in index.ts
// default to international employee
finalConfig.bot.phone_number = finalConfig.bot.bot_phone_number;

finalConfig.debugger = new Debug(finalConfig);

// make the configs global available
export const global = finalConfig;

// 3) Test AOG
// 4) Refactor CCAI
// 5) Build web streamer
