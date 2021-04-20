[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Reimagining Customer Experience 360
Omnichannel Customer Service on Google Cloud

**By Lee Boonstra, Developer Advocate @ Google Cloud.**

TODO description

TODO Architecture picture

## Google Cloud Setup

The steps below, will help you to setup your Google Cloud Platform project and enable all the tools
you will need for this demo.


1. Create GCP Project and assign a billing account to it.

https://console.cloud.google.com

1. Create an environment variable for your project in order to run the setup script
   
```
   export GCP_PROJECT=[project-id]
```

1. Either clone this Git repo on your local HD with the following command:

```
git clone https://github.com/savelee/ccai-360
```

OR

Click the blue button, to clone in Cloud Shell:

[![Open in Cloud Shell](http://gstatic.com/cloudssh/images/open-btn.svg)](https://console.cloud.google.com/cloudshell/editor?cloudshell_git_repo=https%3A%2F%2Fgithub.com%2Fsavelee%2Fccai-360&cloudshell_tutorial=README.md)

1. Run the following install script to start the installation:

```
. setup.sh
```

## Components & Channels Setup

The following steps will guide you to run all the various channels.

### Dialogflow

#### Dialogflow Essentials

1. Create a new agent:
https://dialogflow.cloud.google.com/#/newAgent

* Name: rce-360
* Select Google Project: [project-id]
* Language: English

1. Upgrade to Pay as you Go - plan

2. Go into Settings, and make sure Speech > Speech adaptation is enabled.

#### Dialogflow CX

1. Create a new agent:
https://dialogflow.cloud.google.com/cx/projects

* Select Google Project: [project-id]
* Name: rce-360
* Choose a region
* Choose a timezone
* Language: English


### Node JS Backend Server

You can choose to deploy the web channel in your Google Cloud, or run the demo locally.

#### Deploy with Cloud Run

TODO

#### Run locally

1. In order to run this demo on your local machine. You will need to have Node installed.

```
sudo n latest
sudo npm install -g npm@latestsudo 
```

2. Copy, modify and rename the env.txt file to .env:

```
nano env.txt
cp env.txt .env
```

3. You can start the back-end server with the below command. It will start your app in development mode at http://localhost:8080

```
cd backend && npm run start:dev
```

### Angular Website

#### Deploy with Cloud Run

TODO

#### Run locally

In order to run this demo on your local machine. You will need to have Angular CLI installed

```
sudo npm install -g @angular/cli
```

You can start the Angular site with the below command. It will start your website at http://localhost:4200

```
cd web && ng serve
```

### Flutter Mobile App

#### Run locally

1. In order to run this demo on your local machine. You will need to have Flutter installed.
Follow the install steps from: https://flutter.dev/docs/get-started/install

2. You will need have a service account key copied into the **mobile/assets/** folder, and it should be named **credentials.json**. Download the service account key:
   
```
gcloud iam service-accounts keys create credentials.json \
--iam-account=$SA_EMAIL
```

3. Compile and Run the Flutter app

```
cd mobile && flutter run
```

### AoG Google Assistant Action

1. In order to run this demo on your local machine. You will need to have gActions installed.
Follow the install steps from: https://developers.google.com/assistant/conversational/df-asdk/actions-sdk/gactions-cli

Store gActions somewhere on your hard drive, and assign it to your `PATH` environment variable.

* On Mac and Linux, run `chmod +x gactions` to make the binary executable.
* On Windows, you must have Administrator rights.

Run `gactions` from the CLI to update to the latest version.
https://developers.google.com/assistant/actionssdk/gactions

2. Create a project in the Actions on Google console:
https://actions-console.google.com/u/0/

* Choose project: [project-id]
* Language: English, USA
* pick Custom > Blank Project

#### Run fulfillment locally

1. Install ngrok

```
npm install ngrok -g
ngrok http 8080
```

2. Modify **actions.json** to point to your local ngrok https URL

3. TODO Once your Node backend server is deployed to the Google Cloud, you can take over those URLs

4. You can test your fulfillment by making an example post call

```
curl --header "Content-Type: application/json" \
--request POST \
--data '{"user":{"locale":"en-US","userVerificationStatus":"VERIFIED"},"conversation":{"conversationId":"ABwppHEjwDSpkSNHiGX76mlQAdMSUcsT9bVTrpPqs2xRTHSAz-UtlLY8_LS-bCgQWbraSrZLtFk","type":"NEW"},"inputs":[{"intent":"actions.intent.MAIN","rawInputs":[{"inputType":"VOICE","query":"Talk to CCAIDemo"}]}],"surface":{"capabilities":[{"name":"actions.capability.SCREEN_OUTPUT"},{"name":"actions.capability.AUDIO_OUTPUT"},{"name":"actions.capability.ACCOUNT_LINKING"},{"name":"actions.capability.MEDIA_RESPONSE_AUDIO"}]},"isInSandbox":true,"requestType":"SIMULATOR"}' \
https://0b9f4a537727.ngrok.io/aog/
```

#### Deploy your action

Run the following command:

```
cd assistant
gactions update --action_package action.json --project $GCP_PROJECT
```

It will ask you to visit a URL for authentication, and you will have to copy paste a generated key in the terminal.

### Twilio Phone/Text Channel

1. Install Twilio CLI
`npm install twilio-cli -g`

2. Create a Twilio account:
https://www.twilio.com/console/project/

3. And a CLI profile:

`twilio profiles:create`

4. Buy a phone number:
`twilio api:core:available-phone-numbers:local:list  --area-code="650" --country-code=US --voice-enabled` or https://www.twilio.com/console/phone-numbers/search

5. Wire up your Twilio number with your endpoint on incoming calls. This will automatically start an ngrok tunnel to your machine.

`twilio phone-numbers:update +3197010254316 --voice-url=http://localhost:8080/twiml`
