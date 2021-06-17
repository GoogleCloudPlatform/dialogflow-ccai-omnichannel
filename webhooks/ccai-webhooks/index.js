'use strict';

const axios = require('axios');

async function textMsg() {
    const path = '/api/sms/confirmation/';

    // TODO is there a way to get the user.uid or user.phoneNr?
    // would like to post this.
    // you will need a phoneNr, in order to send this.
    // IF I CAN DETECT IF THE match has a fulfillment
    // ELSE IF INTENT IS FUNNEL STEP CONFIRMATION
    // this is also the place where I want to check if the channel is already SMS
    // to not send another message: "I am sending you a confirmation over SMS"
    // IF WE CAN DETECT THAT, THEN CAN WE WRITE A PARAMETER OR CONTEXT?

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

async function handleRequest(map, request, response){
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
    console.log(request);
    response.json(webhookResponse);
};
