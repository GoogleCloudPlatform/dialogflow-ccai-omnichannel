[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Reimagining Customer Experience 360
Omnichannel Customer Service on Google Cloud

Customers ask us all the time. What's the future of customer care?
We think your contact center shouldn't be a cost center but a revenue center.
It should meet your customers, where they are, 24/7 and be proactive, ubiquitous, and scalable. It should become a trusted partner in your day to day life.

What you will see in the next minute, is an early demo, built by DevRel on how we can reimagine customer experience. A true omnichannel approach!

[Video Demo](https://sites.google.com/corp/google.com/rce/all-demos-in-one?authuser=0)

![alt text](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel/blob/main/images/architecture.png | width=800)

## Google Cloud Setup

The steps below, will help you to setup your Google Cloud Platform project and enable all the tools
you will need for this demo.


1. Create GCP Project and assign a billing account to it.

https://console.cloud.google.com

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

## Dialogflow

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

## Twilio Phone/SMS

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

or manually (to only do this once)

`ngrok http -subdomain=ccai 8080`
and modify the URL in the [Twilio console](https://console.twilio.com/develop/phone-numbers/manage/active) to:
https://ccai.ngrok.io/twiml


NOTE: For outbound calls you will need to whitelist the geo permissions you can call:
https://console.twilio.com/us1/develop/voice/settings/geo-permissions

## Deploy to GKE

This script will create a GKE cluster with the backend container and the client website.
This will allow you to run a chatbot on a website as a channel.
The other channels such as the mobile Flutter app, Twilio phone & SMS and Google Assistant,
require additional configuration as desribed below.

1. Rename **enx.txt** to **.env** and modify the values. This requires a GCP project id and Twilio configuration in case you want to run the demo via a phone.

2. Modify the properties in the *.properties* file. You will need a domain to get an SSL certificate.
We will need a valid TLS certificate, for secure websockets (WSS), which is what you need in order to make use of Twilio.

3. You will need to open your domain register console and add the following details:
(Read more on domain config for GKE)[https://cloud.google.com/kubernetes-engine/docs/tutorials/configuring-domain-name-static-ip]


_Make sure you have executed `. setup.sh` before, to enable all services. Also you will need to have **envsubst** and **kubectl** on your machine, in case you run it locally. See the *tools.sh* script.

1. Execute `. deploy-first-time.sh`

### Optional

In case you already have a cluster and a static IP. You can rebuild and deploy the containers with:

`. deploy.sh`

In case you want to re-deploy individual containers, run the following build scripts:

`gcloud builds submit --config _cloudbuilder/chatserver.yaml`

`gcloud builds submit --config _cloudbuilder/web.yaml`

To delete deployments use:

`kubectl delete deployment web`

To deploy another deployment:

`cat _cloudbuilder/chatserver-deployment.yaml | envsubst | kubectl apply -f -`
`cat _cloudbuilder/web-deployment.yaml | envsubst | kubectl apply -f -`

## Local Components & Channels Setup

The following steps will guide you to run all the various channels. These steps are optionally, in case you want to run it from your own machine.

### AdLingo

[AdLingo Dialogflow Docs](https://docs.adlingo.com/adlingo-api/v2/dialogflow/)

1. Login into your AdLingo environment: https://adsbuilder.adlingo.com/
2. Create a [conversational agent](https://adsbuilder.adlingo.com/agents/add-new/dialogflow_service_account?activeWorkgroupId=5739925852913664):
   - Specify the GCS bucket name and path to service account (it will be gs://[project-name]-bucket/ccai-360-key.json)
   - Event name: `WELCOME-ADLINGO`
3. Create a creative
   - Upload an background image 600x1200 hi-res PNG
   - Upload a logo
   - Upload an avatar
4. For this demo we are integrating an iframe with the preview of the add in the external website interface. In a real world application, this will be provided through an ads platform.


### Node JS Backend Server

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

In order to run this demo on your local machine. You will need to have Angular CLI installed

```
sudo npm install -g @angular/cli
```

You can start the Angular site with the below command. It will start your website at http://localhost:4200

```
cd web && ng serve
```

### Firebase

Using the Admin SDK for Node.js

1. `npm install firebase-admin --save`

2. https://firebase.google.com/docs/auth/admin



### Flutter Mobile App

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

3. Once your Node backend server is deployed to the Google Cloud, you can take over those URLs

4. You can test your fulfillment by making an example post call

```
curl --header "Content-Type: application/json" \
--request POST \
--data '{"user":{"locale":"en-US","userVerificationStatus":"VERIFIED"},"conversation":{"conversationId":"ABwppHEjwDSpkSNHiGX76mlQAdMSUcsT9bVTrpPqs2xRTHSAz-UtlLY8_LS-bCgQWbraSrZLtFk","type":"NEW"},"inputs":[{"intent":"actions.intent.MAIN","rawInputs":[{"inputType":"VOICE","query":"Talk to CCAIDemo"}]}],"surface":{"capabilities":[{"name":"actions.capability.SCREEN_OUTPUT"},{"name":"actions.capability.AUDIO_OUTPUT"},{"name":"actions.capability.ACCOUNT_LINKING"},{"name":"actions.capability.MEDIA_RESPONSE_AUDIO"}]},"isInSandbox":true,"requestType":"SIMULATOR"}' \
https://www.conv.dev/api/aog/
```

#### Deploy your action

Run the following command:

```
cd assistant
gactions update --action_package action.json --project $GCP_PROJECT
```

It will ask you to visit a URL for authentication, and you will have to copy paste a generated key in the terminal.
