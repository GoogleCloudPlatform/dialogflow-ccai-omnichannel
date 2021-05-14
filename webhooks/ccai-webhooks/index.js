'use strict';

const axios = require('axios');

async function textMsg() {
    const path = '/api/sms/confirmation/';

    let results = await doRequest(path);
    return results;
}

async function call() {
    const path = '/api/callme/';

    let results = await doRequest(path);
    return results;
}

async function doRequest(path){
    var resp;
    try {
        resp = await axios.get('https://www.conv.dev' + path);
        console.log(resp);
    } catch (err) {
        // Handle Error Here
        console.error(err);
        resp = err;
    }

    return resp;
}

async function handleRequest(map, request){
    let intent;  
    if(request.body && request.body.queryResult && request.body.queryResult.intent){
      intent = request.body.queryResult.intent.displayName;
    }
    console.log('---');
    console.log(intent);
    let results;	
    if (map.has(intent)){
        results = await map.get(intent)();
        console.log(results);
    } else {
      results = {
          success: false
      };
    }
    return results;
}

exports.sendConfirmation = async function sendConfirmation(request, response) {
    let intentMap = new Map();
    intentMap.set('callme-now', call);
    intentMap.set('confirm-appointment', textMsg);

    let webhookResponse = await handleRequest(intentMap, request);
    console.log(webhookResponse);
    response.json(webhookResponse);
};
