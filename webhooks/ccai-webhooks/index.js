'use strict';

const axios = require('axios');

async function textMsg() {
    const data = JSON.stringify({
        Body: 'CONFIRMATION',
        From: '31651536814'
    });
    const path = '/api/sms/';

    let results = await doRequest(data, path);
    return results;
}

async function call() {
    const data = JSON.stringify({
        From: '31651536814'
    });
    const path = '/api/callme/';

    let results = await doRequest(data, path);
    return results;
}

async function doRequest(data, path){
    axios.post(`https://www.conv.dev${path}`, data)
      .then(function (results) {
        console.log('call was made');
        console.log(results);
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
    let results;	
    if (map.has(intent) !== false){
        results = await map.get(intent)(request);
        console.log(results);
    } else {
      results = map.get('Default Fallback Intent')(request);
    }
    response.json(results);
}

exports.sendConfirmation = function sendConfirmation (request, response) {
    let intentMap = new Map();
    intentMap.set('callme-now', call);
    intentMap.set('confirm-appointment', textMsg);
    let webhookResponse = handleRequest(intentMap, request, response);
    console.log(webhookResponse);
    response.json(webhookResponse)
};
