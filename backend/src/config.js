import * as dotenv from 'dotenv';
dotenv.config();

/* environment configs 
config_id: "development" || "production"
gc_project_id: string
debug: true
vertical: "fsi" || "healthcare" || "retail"
server_url: url or ngrok tunnel
node_port: "8080"

"dialogflow": {
    "version": "cx" || "cxv3beta1" || "v2beta1"
    "cx_agent_id": UUID ID of agent 
    "cx_location": "global" || ... https://cloud.google.com/dialogflow/cx/docs/concept/region
    "language_code": "en-US" || ... https://cloud.google.com/dialogflow/cx/docs/reference/language
},
"web": {
    "encoding": "AUDIO_ENCODING_LINEAR_16" || ... https://cloud.google.com/dialogflow/cx/docs/reference/rpc/google.cloud.dialogflow.cx.v3#google.cloud.dialogflow.cx.v3.AudioEncoding
    "sample_rate_hertz": 16000 || 8000 || 44100 || 48000 ... https://cloud.google.com/speech-to-text/docs/basics 
    "single_utterance": boolean
},
"ccai": {
    "encoding": "AUDIO_ENCODING_LINEAR_16" || ... https://cloud.google.com/dialogflow/cx/docs/reference/rpc/google.cloud.dialogflow.cx.v3#google.cloud.dialogflow.cx.v3.AudioEncoding
    "sample_rate_hertz": 16000 || 8000 || 44100 || 48000 ... https://cloud.google.com/speech-to-text/docs/basics 
    "single_utterance": boolean,
    "output_encoding": "OUTPUT_AUDIO_ENCODING_LINEAR_16"
},
"pubsub": {
    "topic_name": string 
},
"bigquery": {
    "database_name": string
    "table_name": string
    "columns": string
},
"twilio": {
    "phone_number": ".ENV", 
    "account_sid": ".ENV", Your Account SID from www.twilio.com/console
    "auth_token": ".ENV" Your Auth Token from www.twilio.com/console
    "input_encoding": "AUDIO_ENCODING_MULAW",
    "output_encoding": "OUTPUT_AUDIO_ENCODING_LINEAR_16",
    "sample_rate_hertz": 8000,
    "single_utterance": true,
    "interim_results": false,
    "welcome_event": "Welcome"
    "speaking_rate": 1.0, // [0.25, 4.0] - 1 is normal, 2 is twice as fast
    "pitch": 1.0, /// Speaking pitch, in the range [-20.0, 20.0]. 20 means increase 20 semitones from the original pitch. -20 means decrease 20 semitones from the original pitch.
    "volume_gain_db": 0.0, // //Volume gain (in dB) of the normal native volume supported by the specific voice, in the range [-96.0, 16.0].
    "voice_name": "en-US-Standard-H", ////https://cloud.google.com/text-to-speech/docs/voices
    "ssml_gender": "SSML_VOICE_GENDER_FEMALE"
},
"angular": {
    "angular_port": "4200"
}
*/
const globalConfig = {
    "development": {
        "config_id": "development",
        "debug": true,
        "gc_project_id": ".ENV",
        "server_url": ".ENV",
        "node_port": "8080",
        "vertical": "fsi",
        "dialogflow": {
            "version": "cx",
            "cx_agent_id": ".ENV",
            "cx_location": "global",
            "language_code": "en-US"
        },
        "web": {
            "encoding": "AUDIO_ENCODING_LINEAR_16",
            "sample_rate_hertz": 16000,
            "single_utterance": false
        },
        "pubsub": {
            "topic_name": "dialogflow" 
        },
        "bigquery": {

        },
        "twilio": {
            "phone_number": ".ENV",
            "account_sid": ".ENV",
            "auth_token": ".ENV",
            "input_encoding": "AUDIO_ENCODING_MULAW",
            "output_encoding": "OUTPUT_AUDIO_ENCODING_LINEAR_16",
            "sample_rate_hertz": 8000,
            "single_utterance": true,
            "interim_results": false,
            "welcome_event": "WELCOME",
            "speaking_rate": 1.0,
            "pitch": 1.0,
            "volume_gain_db": 0.0,
            "voice_name": "en-US-Standard-H",
            "ssml_gender": "SSML_VOICE_GENDER_FEMALE"
        },
        "angular": {
            "angular_port": "4200"
        }

    },
    "production": {
        "config_id": "production",
        "debug": "false",
        "server_url": "https://"
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
const agentId = process.env.npm_config_AGENT_ID || process.env.AGENT_ID || envConfig.dialogflow.cx_agent_id;
finalConfig.dialogflow.cx_agent_id = agentId;
const phoneNumber = process.env.npm_config_PHONE_NR ||process.env.PHONE_NR || envConfig.twilio.phone_number;
finalConfig.twilio.phone_number = phoneNumber;
const accountSid = process.env.npm_config_TWILIO_ACCOUNT_SID ||process.env.TWILIO_ACCOUNT_SID || envConfig.twilio.account_sid;
finalConfig.twilio.account_sid = accountSid;
const authToken = process.env.npm_config_TWILIO_ACCOUNT_TOKEN ||process.env.TWILIO_ACCOUNT_TOKEN || envConfig.twilio.auth_token;
finalConfig.twilio.auth_token = authToken;

// make the configs global available
export const global = finalConfig;