'use strict';

const axios = require('axios');

async function textMsg(user) {
    const path = '/api/sms/';
    let results = await doRequest(path, user, 'APPOINTMENT_CONFIRMED');

    //event APPOINTMENT_CONFIRMED
    //timeslot appt_time
    return results;
}

async function call(user) {
    const path = '/api/callme/';
    let results = await doRequest(path, user, 'CALL ME');
    return results;
}

async function doRequest(path, user, query){
    console.log(path, user, query);

    var resp;
    try {
        const options = {
            method: 'POST',
            url: `https://www.conv.dev${path}`,
            data: {
                Uid: user,
                Body: query
            }
        }
        resp = axios(options);
        console.log(resp);
    } catch (err) {
        // Handle Error Here
        console.error(err);
        resp = err;
    }

    return resp;
}

async function handleRequest(map, request, response){
    let intent, user;  
    if(request.body && request.body.queryResult && request.body.queryResult.intent){
      intent = request.body.queryResult.intent.displayName;
    }
    // Dialogflow ES get user from Context
    if(request.body && request.body.queryResult && request.body.queryResult.outputContexts){
        request.body.queryResult.outputContexts.forEach(ctx => {
            if(ctx.name.indexOf('/contexts/user') != -1){
                user = ctx.parameters.user;
            }
        });
    }

    let results;	
    if (map.has(intent)){
        results = await map.get(intent)(user);
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
    response.json('OK');
};
