'use strict';
const axios = require('axios');

async function doRequest(user, country){
    try {
        if(!user) console.error(`No user, so can't call.`);

        axios.post('https://www.conv.dev/api/callme/', {
            Uid: user,
            FromCountry: country,
            Body: 'CALL ME'
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
    let user, country;  
    let body = request.body;
    let sessionInfo = body.sessionInfo;
    let fulfillmentInfo = body.fulfillmentInfo;
    let response;

    if(body.sessionInfo && sessionInfo.parameters && fulfillmentInfo && fulfillmentInfo.tag){
      if(body.fulfillmentInfo.tag == 'call.support'){
        user = sessionInfo.parameters['0'].user;
        country = sessionInfo.parameters['0'].country;
        
        response = await doRequest(user, country);
      }
    } else {
        console.error('The tag: call.support is required in the Dialogflow CX webhook fulfillment settings.')
    }

    return response;
}

exports.callUser = async function callUser(request, response) {
    let webhookResponse = await handleRequest(request); 
    response.json(webhookResponse);
};