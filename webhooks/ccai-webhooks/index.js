'use strict';

const axios = require('axios');

async function textMsg(request, response) {
    const data = JSON.stringify({
        Body: 'CONFIRMATION',
        From: '31651536814'
    });
    const path = '/api/sms/';

    let results = await doRequest(data, path);
    response.json(results);
}

async function call(request, response) {
    const data = JSON.stringify({
        From: '31651536814'
    });
    const path = '/api/callme/';

    let results = await doRequest(data, path);
    response.json(results);
}

async function doRequest(data, path){
    axios.post(`https://www.conv.dev${path}`, data)
      .then(function (response) {
        console.log('call was made');
      })
      .catch(function (error) {
        console.log(error);
    });
}

async function handleRequest(map, request){
    let intent;  
    if(request.body && request.body.queryResult && request.body.queryResult.intent){
      intent = request.body.queryResult.intent.displayName;
    }
    let response;	
    console.log(intent);
    if (map.has(intent) !== false){
        response = await map.get(intent)(request);
        console.log(response);
    } else {
        response = map.get('Default Fallback Intent')(request);
    }
    return response;
}

exports.sendConfirmation = function sendConfirmation (request, response) {
    let intentMap = new Map();
    intentMap.set('callme-now', call);
    intentMap.set('confirm-appointment', textMsg);
    let webhookResponse = handleRequest(intentMap, request);
    console.log(webhookResponse);
    response.json(webhookResponse)
};
