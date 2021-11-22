'use strict';

const axios = require('axios');

async function doRequest(user, country){
    var resp;
    try {

        if(!user) console.error(`No user, so can't call.`);

        const options = {
            method: 'POST',
            url: `https://www.conv.dev/api/callme/`,
            data: {
                Uid: user,
                FromCountry: country,
                Body: 'CALL ME'
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
    let user, country;  
    let body = request.body;
    let response;

    if(body && body.sessionInfo && body.sessionInfo.parameters && body.fulfillmentInfo && body.fulfillmentInfo.tag){
      if(body.fulfillmentInfo.tag == 'call.support'){
          user = body.sessionInfo.parameters.user;
          country = body.sessionInfo.parameters.country;
          response = await doRequest(user, country);
      }
    } else {
        console.error('The tag: call.support is required in the Dialogflow CX webhook fulfillment settings.')
    }

    return response;
}

exports.callUser = async function callUser(request, response) {
    let webhookResponse = await handleRequest(request); 
    response.json('OK');
};