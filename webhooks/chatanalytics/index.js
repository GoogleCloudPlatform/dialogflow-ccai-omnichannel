const { BigQuery } = require('@google-cloud/bigquery');
const language = require('@google-cloud/language');
const DLP = require('@google-cloud/dlp');

const projectId = process.env.GCLOUD_PROJECT;
const bqDataSetName = process.env.DATASET;
const bqTableName = process.env.TABLE;

const bq = new BigQuery();
const dlp = new DLP.DlpServiceClient();

// Make use of a dataset called: chatanalytics
const dataset = bq.dataset(bqDataSetName);
// Make use of a BigQuery table called: chatmessages
const table = dataset.table(bqTableName);
const bqRow = {};

var detectPIIData = async function(text) {
  // The minimum likelihood required before returning a match
  const minLikelihood = 'LIKELIHOOD_UNSPECIFIED';
 
  // The infoTypes of information to match
  const infoTypes = [ 
    {name: 'PERSON_NAME'}, 
    {name: 'FIRST_NAME'}, 
    {name: 'LAST_NAME'}, 
    {name: 'MALE_NAME'}, 
    {name: 'FEMALE_NAME'},
    {name: 'IBAN_CODE'},
    {name: 'IP_ADDRESS'},
    {name: 'LOCATION'},
    {name: 'SWIFT_CODE'},
    {name: 'PASSPORT'},
    //{name: 'PHONE_NUMBER'},
    {name: 'NETHERLANDS_BSN_NUMBER'},
    {name: 'NETHERLANDS_PASSPORT'}
  ];
  

  // Construct transformation config which replaces sensitive info with its info type.
  // E.g., "Her email is xxx@example.com" => "Her email is [EMAIL_ADDRESS]"
  const replaceWithInfoTypeTransformation = {
    primitiveTransformation: {
      replaceWithInfoTypeConfig: {},
    },
  };

  // Construct redaction request
  const request = {
    parent: dlp.projectPath(projectId),
    item: {
      value: text,
    },
    deidentifyConfig: {
      infoTypeTransformations: {
        transformations: [replaceWithInfoTypeTransformation],
      },
    },
    inspectConfig: {
      minLikelihood: minLikelihood,
      infoTypes: infoTypes,
    },
  };

  // Run string redaction
  try {
    const [response] = await dlp.deidentifyContent(request);
    const resultString = response.item.value;
    console.log(`REDACTED TEXT: ${resultString}`);
    if (resultString) {
      bqRow['TEXT'] = resultString;
    } else {
        bqRow['TEXT'] = text;
    }
  } catch (err) {
    console.log(`Error in deidentifyContent: ${err.message || err}`);
    bqRow['TEXT'] = text;
  }
}

var getSentiment = function(text, callback){
    const client = new language.LanguageServiceClient();

    client.analyzeSentiment({
        document: {
            content: text,
            type: 'PLAIN_TEXT'
        }
    }).then(function(responses) {
        var result = responses[0].documentSentiment;
        console.log('SENTIMENT:');
        console.log(result);
        bqRow['SENTIMENT_SCORE'] = result.score;
        bqRow['SENTIMENT_MAGNITUDE'] = result.magnitude;
    })
    .catch(function(err) {
        console.error(err);
    });
};

  //Insert rows in BigQuery
  var insertInBq = async function(row){
    table.insert(row, function(err, apiResponse){
        console.log(apiResponse)
      if (!err) {
        console.log(row);
        console.log("[BIGQUERY] - Saved.");
      } else {
        console.error(err);
        console.log(err.errors)
      }
    });
  };

  exports.subscribe = async (data, context, callback) => {
    const pubSubMessage = data;
    const buffer = Buffer.from(pubSubMessage.data, 'base64').toString();
    var buf = JSON.parse(buffer);
    
    console.log(buf.text);

    bqRow['SESSION_ID'] = buf.sessionId;
    bqRow['SESSION_PATH'] = buf.sessionPath;
    bqRow['PLATFORM'] = buf.platform;
    bqRow['LANGUAGE_CODE'] = buf.languageCode;
    bqRow['DATE_TIME'] = (buf.dateTimeStamp/1000);
    bqRow['QUERY_TEXT'] = buf.query;
    bqRow['FULFILLMENT_TEXT'] = buf.fulfillmentText;
    //bqRow['RESPONSE_MESSAGES'] = buf.responseMessages;

    //FUNNEL_STEP:
    //USER_UID:
    //TOPIC_MINING:
    //NPS:
    //CSAT:
    //CES:


    await detectPIIData(buf.text);

    if(buf.intentDetection && buf.intentDetection.intent){
        bqRow['INTENT_DETECTION_DISPLAYNAME'] = buf.intentDetection.intent.displayName;
        bqRow['INTENT_DETECTION_NAME'] = buf.intentDetection.intent.name;
        bqRow['INTENT_DETECTION_IS_FALLBACK'] = buf.intentDetection.intent.isFallback;
        bqRow['INTENT_DETECTION_IS_END'] = buf.intentDetection.intent.isEndInteraction;
        bqRow['INTENT_DETECTION_CONFIDENCE'] = buf.intentDetection.intent.intentDetectionConfidence;
        bqRow['INTENT_DETECTION_IS_LIVE_AGENT'] = buf.intentDetection.intent.isLiveAgent;
        //bqRow['INTENT_DETECTION_EVENT'] = buf.intentDetection.intent.events;
        //bqRow['INTENT_DETECTION_PARAMETERS'] = buf.intentDetection.intent.parameters;
    }

    if(buf.sentiment && buf.sentiment.score && buf.sentiment.magnitude){
        bqRow['SENTIMENT_SCORE'] = buf.sentiment.score;
        bqRow['SENTIMENT_MAGNITUDE'] = buf.sentiment.magnitude;
    } else {
        await getSentiment(buf.text);
    }

    await insertInBq(bqRow);

    // Don't forget to call the callback.
    callback();
  };
