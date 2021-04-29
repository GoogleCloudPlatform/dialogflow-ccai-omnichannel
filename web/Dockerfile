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