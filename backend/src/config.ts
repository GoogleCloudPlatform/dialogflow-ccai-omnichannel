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
        },
        web?: {
            encoding?: string, // 'AUDIO_ENCODING_LINEAR_16' ||
            // https://cloud.google.com/dialogflow/cx/docs/reference/rpc/google.cloud.dialogflow.cx.v3
            // #google.cloud.dialogflow.cx.v3.AudioEncoding
            sample_rate_hertz?: number // 16000 || 8000 || 44100 || 48000 ... https://cloud.google.com/speech-to-text/docs/basics
            single_utterance?: boolean
        },
        angular?: {
            angular_port: number
        }
        ccai?: {
            encoding: string, // 'AUDIO_ENCODING_LINEAR_16' ||
            // ... https://cloud.google.com/dialogflow/cx/docs/reference/rpc/google.cloud.dialogflow.cx.v3
            // #google.cloud.dialogflow.cx.v3.AudioEncoding
            sample_rate_hertz: number, // 16000 || 8000 || 44100 || 48000 ... https://cloud.google.com/speech-to-text/docs/basics
            single_utterance: boolean,
            output_encoding?: string // 'OUTPUT_AUDIO_ENCODING_LINEAR_16'
        },
        twilio?: {
            phone_number: string // .env
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
            ssml_gender: string // 'SSML_VOICE_GENDER_FEMALE'
        },
        pubsub?: {
            topic_name: string
        },
        bigquery?: {
            database_name: string
            table_name: string
            columns: string
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
            version: 'v2beta1', // 'v2beta1' || 'cx',
            cx_agent_id: '.ENV',
            cx_location: '.ENV',
            language_code: 'en-US'
        },
        web: {
            encoding: 'AUDIO_ENCODING_LINEAR_16',
            sample_rate_hertz: 16000,
            single_utterance: false
        },
        pubsub: {
            topic_name: 'dialogflow'
        },
        // bigquery: {
        //
        // },
        twilio: {
            phone_number: '.ENV',
            account_sid: '.ENV',
            auth_token: '.ENV',
            input_encoding: 'AUDIO_ENCODING_MULAW',
            output_encoding: 'OUTPUT_AUDIO_ENCODING_LINEAR_16',
            sample_rate_hertz: 8000,
            single_utterance: true,
            interim_results: false,
            welcome_event: 'WELCOME',
            speaking_rate: 1.0,
            pitch: 1.0,
            volume_gain_db: 0.0,
            voice_name: 'en-US-Wavenet-H',
            ssml_gender: 'SSML_VOICE_GENDER_FEMALE',
            model: 'phone_call',
            model_variant: 'USE_ENHANCED'
        },
        angular: {
            angular_port: 4200
        }

    },
    production: {
        config_id: 'production',
        debug: false,
        server_url: 'https://'
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
const port = process.env.npm_config_PORT || process.env.PORT || envConfig.node_port;
finalConfig.node_port = port;
const vertical = process.env.npm_config_VERTICAL || process.env.VERTICAL || envConfig.vertical;
finalConfig.vertical = vertical;
const agentId = process.env.npm_config_AGENT_ID || process.env.AGENT_ID || envConfig.dialogflow.cx_agent_id;
finalConfig.dialogflow.cx_agent_id = agentId;
const cxLocation = process.env.npm_config_CX_LOCATION || process.env.CX_LOCATION || envConfig.dialogflow.cx_location;
finalConfig.dialogflow.cx_location = cxLocation;
const phoneNumber = process.env.npm_config_PHONE_NR ||process.env.PHONE_NR || envConfig.twilio.phone_number;
finalConfig.twilio.phone_number = phoneNumber;
const accountSid = process.env.npm_config_TWILIO_ACCOUNT_SID ||process.env.TWILIO_ACCOUNT_SID || envConfig.twilio.account_sid;
finalConfig.twilio.account_sid = accountSid;
const authToken = process.env.npm_config_TWILIO_ACCOUNT_TOKEN ||process.env.TWILIO_ACCOUNT_TOKEN || envConfig.twilio.auth_token;
finalConfig.twilio.auth_token = authToken;

finalConfig.debugger = new Debug(finalConfig);

// make the configs global available
export const global = finalConfig;


// 3) Test AOG
// 4) Refactor CCAI
// 5) Build web streamer
