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
 
### STAGE 1: Build ###
FROM gcr.io/cloud-builders/npm as builder
LABEL maintainer="Lee Boonstra"

WORKDIR /my-app

COPY package.json /my-app/
COPY angular.json /my-app/
COPY tsconfig.json /my-app/
COPY tsconfig.app.json /my-app/
COPY tslint.json /my-app/

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force

COPY /src/ /my-app/src/

RUN npm install --force
RUN npm run build

### STAGE 2: Setup ###
FROM nginx:1.15

ADD ./nginx/default.conf /etc/nginx/conf.d/
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /my-app/dist/ccai360/ /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]