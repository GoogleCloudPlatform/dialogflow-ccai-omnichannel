'use strict';

const axios = require('axios');

async function doRequest(user, country, timeslot){
    var resp;
    try {
        if(!user) console.error(`No user, so can't send SMS.`);
        const options = {
            method: 'POST',
            url: `https://www.conv.dev/api/sms/`,
            data: {
                Uid: user,
                FromCountry: country,
                Timeslot: timeslot,
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
    let sessionInfo = body.sessionInfo;
    let fulfillmentInfo = body.fulfillmentInfo;
    let response;

    if(sessionInfo && sessionInfo.parameters && fulfillmentInfo && fulfillmentInfo.tag){
      if(fulfillmentInfo.tag == 'sms.confirmation'){
          console.log(sessionInfo);
          user = sessionInfo.parameters.user;
          country = sessionInfo.parameters.country;

        timeslot = getFormattedTimeString(sessionInfo.parameters.timeslot);

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

function getFormattedTimeString(timeObj){
    if(!timeObj) console.error('timeslot missing');
    var h = timeObj.hours;
    var m = timeObj.minutes;
    var fM = ''; var formattedTime = '';

    if(h > 12) h = h-12;

    if(m == '30') {
        fM = '30';
    } else {
        fM = '00';
    }

    formattedTime = `for ${h}:${fM} `;
    if(h <= 12) {
        formattedTime = formattedTime + 'AM';
    } else {
        formattedTime = formattedTime + 'PM';
    }

    return formattedTime;
}