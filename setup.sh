#
# @license
# Copyright 2021 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# =============================================================================
#/

#!/bin/bash

bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

## SERVICE ACCOUNTS
bold "Create a service account"
export SERVICE_ACCOUNT_NAME=$GCP_PROJECT-serviceaccount
export SA_EMAIL=$SERVICE_ACCOUNT_NAME@$GCP_PROJECT.iam.gserviceaccount.com
export BUCKET_NAME=$GCP_PROJECT-bucket

gcloud iam service-accounts create \
  $SERVICE_ACCOUNT_NAME \
  --display-name $SERVICE_ACCOUNT_NAME

bold "Download service account key"
gcloud iam service-accounts keys create ccai-360-key.json \
--iam-account=$SA_EMAIL

## ACCESS RIGHTS
bold "Adding policy binding to email: $SA_EMAIL..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.dataViewer
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/bigquery.jobUser
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.admin
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/dialogflow.reader
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/errorreporting.admin
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/logging.logWriter
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/pubsub.editor
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member serviceAccount:$SA_EMAIL \
  --role roles/pubsub.viewer
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/iam.serviceAccountKeyAdmin
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/firebase.admin
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/storage.objectCreator
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member serviceAccount:$SA_EMAIL \
  --role roles/storage.objectViewer

## ENABLE APIS
bold "Enable APIs..."
gcloud services enable \
  bigquery-json.googleapis.com \
  cloudtrace.googleapis.com \
  cloudfunctions.googleapis.com \
  dialogflow.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  sourcerepo.googleapis.com \
  container.googleapis.com \
  containerregistry.googleapis.com \
  cloudbuild.googleapis.com \
  storage.googleapis.com \
  run.googleapis.com

## ADD FIREBASE
bold "Add firebase to your GCP project"
firebase projects:addfirebase $GCP_PROJECT --debug  

## CREATE A BUCKET
gsutil mb gs://$BUCKET_NAME
gsutil cp ccai-360-key.json gs://$BUCKET_NAME
gsutil acl ch -u dapio-prod@appspot.gserviceaccount.com:READ gs://$BUCKET_NAME/ccai-360-key.json

## CREATE A CLOUD FUNCTION FOR WEBHOOKS
bold "Creating Cloud Functions..."
gcloud functions deploy ccaiWebhook --region=$REGION_ALTERNATIVE \
--memory=512MB \
--runtime=nodejs10 \
--trigger-http \
--source=webhooks/ccai-webhooks \
--stage-bucket=$BUCKET_NAME \
--timeout=60s \
--allow-unauthenticated \
--entry-point=sendConfirmation
