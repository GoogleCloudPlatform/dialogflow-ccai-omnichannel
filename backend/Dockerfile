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
 
FROM node:12.22.1

LABEL maintainer="Lee Boonstra"

WORKDIR /app

COPY package.json /app
COPY . /app

RUN npm set progress=false && npm config set depth 0 && npm cache clean --force
RUN npm install grpc --unsafe-perm
RUN npm install pm2 -g
RUN npm install
RUN npm run build

EXPOSE 8080

CMD ["pm2-runtime", "/app/dist/index.js"]