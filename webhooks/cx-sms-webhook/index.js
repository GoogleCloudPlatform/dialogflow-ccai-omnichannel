'use strict';

const axios = require('axios');

async function doRequest(user, country, timeslot){
    console.log(timeslot);
    var resp;
    try {
        if(!user) console.error(`No user, so can't send SMS.`);
        const options = {
            method: 'POST',
            url: `https://www.conv.dev/api/sms/`,
            data: {
                Uid: user,
                FromCountry: country,
                timeslot: timeslot,
                Body: 'APPOINTMENT_CONFIRMED'
            }
        }
        resp = axios(options);
    } catch (err) {
        // Handle Error Here
        console.error(err);
        resp = err;
    }

    return resp;
}

async function handleRequest(request){
    let user, country, timeslot;  
    let body = request.body;
    let response;

    if(body && body.sessionInfo && body.sessionInfo.parameters && body.fulfillmentInfo && body.fulfillmentInfo.tag){
      if(body.fulfillmentInfo.tag == 'sms.confirmation'){
          console.log(body.sessionInfo);
          user = body.sessionInfo.parameters.user;
          country = body.sessionInfo.parameters.country;

        if(body.sessionInfo.parameters.timeslot.hours && body.sessionInfo.parameters.timeslot.minutes){
            timeslot = `${body.sessionInfo.parameters.timeslot.hours}:${body.sessionInfo.parameters.timeslot.minutes}`;
            console.log('Timeslot');
            console.log(timeslot);
        }

          response = await doRequest(user, country, timeslot);
      }
    } else {
        console.error('The tag: sms.confirmation is required in the Dialogflow CX webhook fulfillment settings.')
    }

    return response;
}

exports.sendConfirmation = async function sendConfirmation(request, response) {
    let webhookResponse = await handleRequest(request); 
    response.json('OK');
};