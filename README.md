[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

# Reimagining Customer Experience 360
Omnichannel Customer Service on Google Cloud

Customers ask us all the time. What's the future of customer care?
We think your contact center shouldn't be a cost center but a revenue center.
It should meet your customers, where they are, 24/7 and be proactive, ubiquitous, and scalable. It should become a trusted partner in your day to day life.

What you will see in the next minute, is an early demo, built by DevRel on how we can reimagine customer experience. A true omnichannel approach!

[![Omnichannel Demo Video](https://img.youtube.com/vi/ToYM8R0wW1I/0.jpg)](https://youtu.be/ToYM8R0wW1I)

## Table of Contents

<img src="https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel/blob/main/images/architecture.png" width="800" />

Setup to the various parts:

* [Google Cloud](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#google-cloud-setup)
* [Dialogflow](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#dialogflow)
* [Twilio Phone & SMS](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#twilio-phonesms)
* [Firebase](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#firebase)
* [Deploy to GKE](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#deploy-to-gke)
  
To run this environment locally use these setup guides:

* [Business Messages](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#business-messages)
* [Business Messages Adlingo](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#business-messages-adlingo)
* [Verified Calls](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#business-messages-verified-calls)
* [Node JS Backend Server](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#node-js-backend-server)
* [Angular Website](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#angular-website)
* [Flutter Mobile App](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#flutter-mobile-app)
* [Actions on Google (Google Assistant)](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#aog-google-assistant-action)

Once everything is installed you can run the Demo Script:

* [Demo script](https://github.com/GoogleCloudPlatform/dialogflow-ccai-omnichannel#prepare-for-demo)


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

## Firebase

You will need an account on Firebase as we will store authentication data
in Firebase auth.

1. https://firebase.google.com/docs/auth/admin

To install the Firebase command-line tools use:

2. `npm install firebase-admin --save`

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

## Local Components and Channels

The following steps will guide you to run all the various channels. These steps are optionally, in case you want to run it from your own machine.

### Business Messages
With Business Messages, you can place messaging buttons for brands within organic Google search results. When a user clicks on a messaging button, they start a conversation with an entity representing the brand—the brand's agent. See the [Business Messages](https://developers.google.com/business-communications/business-messages/guides) documentation for more information.

#### Before you begin

1.  [Register with Business Messages](https://developers.google.com/business-communications/business-messages/guides/set-up/register).

#### Configure your webhook
You must specify your webhook URL in order to start receiving messages for the Business Messages agent you create.

1.  Open the [Business Communications Developer Console](https://business-communications.cloud.google.com) and sign in with your Business Messages Google account.
1.  Click **Account settings**.
1.  Make sure the correct partner account is selected.
1.  Enter your **Business Messages webhook URL** as *https://YOUR_WEB_SEVER/api/business-messages* where `YOUR_WEB_SEVER` is the domain where you are hosting the backend of the `dialogflow-ccai-omnichannel` project.
1.  Click **Save**.

#### Create your Business Messages agent
Once you've registered, it's time to create your agent.

1.  Open the [Business Communications Developer Console](https://business-communications.cloud.google.com) and sign in with your Business Messages Google account.
1.  Click **Create agent**.
1.  If you're prompted for **Agent type**, choose **Business Messages**.
1.  Enter values for **Brand name** and **Agent name**.
1.  Click **Create agent**.
1.  When your agent is available, click your agent.

#### Test your Business Messages agent
Each agent has test URLs that let you see how a conversation with that agent
appears to users. Use a test URL to verify that messages sent by users interacting with your agent are being received by your webhook and automatically responded to by the Dialogflow agent you've set up.

To test an agent,

1.  Open the [Business Communications Developer Console](https://business-communications.cloud.google.com) and sign in with your Business Messages Google account.
1.  Choose your agent.
1.  Under **Agent test URLs** on the **Overview** page, click the **Android** button or **iOS** button to copy the test URL to your device's clipboard and send to your mobile device or use the **Send** to email feature.
1.  Open the test URL on your mobile device and send a message to the Business Messages agent.

### Business Messages AdLingo

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

### Business Messages Verified Calls
With Verified Calls, you can upgrade a regular phone call from a business to a consumer. When a user receives a call from a business, the user sees who is calling, the logo of the business, that the business has been verified, and the reason for the call. See the [Verified Calls](https://developers.google.com/business-communications/verified-calls/guides/learn) documentation for more information.

#### Before you begin

1.  [Register with Verified Calls](https://developers.google.com/business-communications/verified-calls/guides/set-up/partner).

#### Configure your webhook
You must specify your webhook URL in order to start receiving messages for the Business Messages agent you create.

1.  Open the [Business Communications Developer Console](https://business-communications.cloud.google.com) and sign in with your Business Messages Google account.
1.  Click **Account settings**.
1.  Make sure the correct partner account is selected.
1.  Enter your **Business Messages webhook URL** as *https://YOUR_WEB_SEVER/api/business-messages* where `YOUR_WEB_SEVER` is the domain where you are hosting the backend of the `dialogflow-ccai-omnichannel` project.
1.  Click **Save**.

#### Create your Verified Calls agent
Once you've registered, it's time to create your agent.

1.  Open the [Business Communications Developer Console](https://business-communications.cloud.google.com) and sign in with your Verified Calls Google account.
1.  Click **Create agent**.
1.  If you're prompted for **Agent type**, choose **Verified Calls**.
1.  Enter values for **Brand name**, **Agent name**, and **Agent logo**.
1.  Click **Next**.
1.  Enter the phone number of the business.
1.  Click **Next**.
1.  Enter the call reasons.
1.  Click **Next**.
1.  Enter values for the brand contact, brand website, and yourself.
1.  Click **Finish setup**.

Once your agent has been verified by Google, when your business makes a call to a user, the user will see the business information. Note that this only works for Android users.

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
cd backend && npm run watch
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

### Flutter Mobile App

1. In order to run this demo on your local machine. You will need to have Flutter installed. Follow the install steps from: https://flutter.dev/docs/get-started/install

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


### Prepare for Demo

[![Omnichannel Demo Video](https://img.youtube.com/vi/ToYM8R0wW1I/0.jpg)](https://youtu.be/ToYM8R0wW1I)

#### Create a RCE360 "G-Mortgages" Account:

1. Either go to your local environment or the live environment and sign up for an account. This will store your info in Firebase. It's important that you are setting up a Gmail address and a phone number. In case you will demo the Google Assistant, make sure you use the same gmail address.
   
http://localhost:4200/profile / https://www.conv.dev/profile

2. Login on the G-Mortgages website http://localhost:4200 / https://www.conv.dev

3. Follow this flow in the web:

```
Welcome to G-Mortgages. I see that you have prequalified for a fixed rate mortgage. Would you like me to book an appointment?
> Yes
I can schedule a mortgage consultation with Mr. Gerrit Oogle. Monday the 8th at 2 pm. Would this work for you?
> Yeah that sounds good
Perfect, you'll have a mortgage appointment for Monday the 8th at 2 pm.
You will receive a text confirmation for the virtual appointment via text.
Is there anything else I can help you with?
> No that's it. Thanks.
```

4. Get your cell phone, you should have received a text message:

```
Hi [Name]. Thank you for scheduling an appointment with G-Mortgages.
Your virtual consultation with a licensed broker has been set for tomorrow,
Wednesday the 8th at 2:00pm. Feel free to reply, if you want to re-schedule your appointment.
> Can we make it a half hour later?
We have that time available, I will update the appointment to 2:30pm. If you have any questions, you can use the Google Assistant to talk to G-Mortgages.
> Can you give me a call?
Sure. I will contact you on the number that's set in your profile.
```

5. You will receive a phone call:

```
> Hello
Hi, I am the virtual assistant for G-Mortgages. You've asked me to give you a ring. How can I help?
> I am thinking of changing my job, will this affect my mortgage?
That’s exciting! Unfortunately, taking a job at a new company will affect your length of employment and may impact your application.
> Ok, now what?
I know it’s a tough situation, but if you could defer the start date until after the mortgage is approved that would help. Is there anything else I can help you with?
> What's an adjustable rate mortgage?
Adjustable rate mortgages typically have low initial interest rates. After the initial period, the rate adjusts to the current market conditions.
> Is it better than a fixed rate mortgage?
Well, it depends. How long do you plan to own the house?
> Maybe 30 years.
In that case I would suggest an adjustable rate mortgage. No sense in locking a rate for 30 years if you’re not going to live there that long. Is there anything else I can help you with?
> No thank you, good bye.
Thank you for contacting G-Mortgages. Have a nice day.
```

6. TODO Business Messages Steps

7. TODO Google Assistant Steps

8. To view the Looker Dashboard go to /dashboard