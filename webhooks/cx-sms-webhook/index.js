'use strict';
const axios = require('axios');

async function doRequest(user, country, timeslot){
    try {
        if(!user) console.error(`No user, so can't send SMS.`);
        
        axios.post('https://www.conv.dev/api/sms/', {
            Uid: user,
            FromCountry: country,
            Timeslot: timeslot,
            Body: 'APPOINTMENT_CONFIRMED'
        })
        .then(function (response) {
            return response;
        })
        .catch(function (error) {
            return error;
        });
        
    } catch (err) {
        console.error(err);
        return err;
    }
}

async function handleRequest(request){
    let user, country, timeslot;  
    let body = request.body;
    let sessionInfo = body.sessionInfo;
    let fulfillmentInfo = body.fulfillmentInfo;
    let response;

    if(sessionInfo && sessionInfo.parameters && fulfillmentInfo && fulfillmentInfo.tag){
      if(fulfillmentInfo.tag == 'sms.confirmation'){
          user = sessionInfo.parameters['0'].user;
          country = sessionInfo.parameters['0'].country;

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
    response.json(webhookResponse);
};

function getFormattedTimeString(timeObj){
    if(!timeObj) console.error('timeslot missing');
    var h = timeObj.hours;
    var m = timeObj.minutes;
    var fM = ''; var fH = ''; var formattedTime = '';

    if(h > 12) {
        fH = h-12;
    } else {
        fH = h;
    }
    
    if(m == '30') {
        fM = '30';
    } else {
        fM = '00';
    }

    formattedTime = `for ${fH}:${fM} `;
    if(h <= 12) {
        formattedTime = formattedTime + 'AM';
    } else {
        formattedTime = formattedTime + 'PM';
    }

    return formattedTime;
}