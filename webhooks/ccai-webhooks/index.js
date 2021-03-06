'use strict';

const axios = require('axios');

async function textMsg(user, country) {
    const path = '/api/sms/';
    let results = await doRequest(path, user, 'APPOINTMENT_CONFIRMED');

    //event APPOINTMENT_CONFIRMED
    //timeslot appt_time
    return results;
}

async function call(user, country) {
    const path = '/api/callme/';
    var results;
    if(user){
        results = await doRequest(path, user, 'CALL ME');
    } else {
        console.error('no user, can not call');
    }
    return results;
}

async function doRequest(path, user, country, query){
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
        // console.log(resp);
    } catch (err) {
        // Handle Error Here
        console.error(err);
        resp = err;
    }

    return resp;
}

async function handleRequest(map, request, response){
    let intent, user, country;  
    if(request.body && request.body.queryResult && request.body.queryResult.intent){
      intent = request.body.queryResult.intent.displayName;
    }
    // Dialogflow ES get user from Context
    if(request.body && request.body.queryResult && request.body.queryResult.outputContexts){
        request.body.queryResult.outputContexts.forEach(ctx => {
            if(ctx.name.indexOf('/contexts/user') != -1){
                user = ctx.parameters.user;
            }
            if(ctx.name.indexOf('/contexts/country') != -1){
                country = ctx.parameters.country;
            }
        });
    }

    let results;	
    if (map.has(intent)){
        results = await map.get(intent)(user, country);
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
