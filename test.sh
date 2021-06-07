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

bold "Set all vars..."
set -a
  source .properties
  source backend/.env
  set +a

gcloud functions deploy chatanalytics --region=$REGION_ALTERNATIVE \
--memory=512MB \
--trigger-topic=$PUBSUB_TOPIC \
--runtime=nodejs10 \
--source=webhooks/chatanalytics \
--stage-bucket=$BUCKET_NAME \
--timeout=60s \
--entry-point=subscribe \
--set-env-vars GCLOUD_PROJECT=$PROJECT_ID,DATASET=$DATASET,TABLE=$TABLE
