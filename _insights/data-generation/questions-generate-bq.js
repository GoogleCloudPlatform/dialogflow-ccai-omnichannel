var fs = require('fs');
const arrayToNdjson = require('array-to-ndjson');
const { v4: uuidv4 } = require('uuid');
var exportBq = [];
var secondsCounter = 0;
var usedQuestionsArray = [];

var userArray = [
    { uid: '1MCuGckfUTMMf8UxgdccIEjDWwN2', country: 'NL'},
    { uid: 'L8CKPdT15kTIO3Opr64b3Tdg83p2', country: 'USA'},
    { uid: 'CBS3vj325IWo2cPs9rjgQp7FuSi1', country: 'IT'},
    { uid: 'QoNtbXkRZFSGmHlF9EaM47K7drt2', country: 'USA'},
    { uid: '0jq4arFUyoT8oYu9TsiBVjGyKFd2', country: 'NL'},
    { uid: 's3yu5kclUShispfcjXgvqbul7dA3', country: 'NL'},
    { uid: 'r9f7irzTAmMrhXt1y49o6DqyZAk2', country: 'NL'},
];

var questionArray = [
    {
        question: [
            'Can I get a mortgage without a credit score?',
            'Is it possible to get a mortgages without a credit score?',
            'What if I have a credit score, can I still get a loan?',
            'I want a mortgage, but I have a credit score.',
            'What to do when you have a credit score?',
            'I have a credit score, can I still apply for a mortgage?'
        ],
        intentName: 'Sup: Mortgage without credit score',
        intentId: 'projects/ccai-360/locations/global/agent/intents/cabfc42c-495a-4296-b8f1-dc9a22dc8ad1',
        answer: `If you’ve paid off all your debt—and we recommend you do before buying a home—it is possible you won’t have a credit score. Don’t worry; you can still get a mortgage.
                 If you apply for a mortgage without a credit score, you’ll need to go through a process called manual underwriting. Manual underwriting simply means you’ll be asked to provide additional paperwork for the underwriter to review personally. 
                 Your loan process may take a little longer, but buying a home without the strain of extra debt is worth it!`
    },
    {
        question: [
            'Do broker fees get added to mortgage?',
            'Can I include the purchasing and financing costs in my mortgage?',
            'Can I take a loan for a vacation home?',
        ],
        intentName: 'Default Fallback Intent',
        intentId: 'projects/ccai-360/locations/global/agent/intents/c4676c8d-1de0-4dc3-bd49-3364bad0c372',
        answer: `I missed what you just said, can you rephrase that?`
    },
    {
        question: [
            'What’s the difference between being prequalified and preapproved?',
            'Prequalified? PreApproved?',
            'Can you explain the differences between prequalified and preapproved?',
            'What is prequalified?',
            'What is preapproved?',
            'Preapproved vs. prequalified, what is the difference?'
        ],
        intentName: 'Sup: Difference prequalified & preapproved',
        intentId: 'projects/ccai-360/locations/global/agent/intents/ef8356c4-7ddd-4479-8d9b-29fcdbc7eafd',
        answer: `A quick consultation with a G-Mortgages consultant, about your income, assets and down payment is all it takes to get prequalified. But if you want to get preapproved, you will need to verify your financial information and submit your loan for preliminary underwriting. 
        A preapproval takes a little more time and documentation, but it also carries a lot more weight.
        Which is better? Think of prequalification as an initial step and preapproval as the green light signaling that you’re ready to start your home search. 
        When a G-Mortgages consultant reviews your offer, a preapproval means you’re a serious buyer who already started the loan process.`
    },
    {
        question: [
            'How much home can I afford?',
            'How much can I afford?',
            'How much can I take?',
            'How big of a mortgage should I take?',
            'What is the maximum of a mortgage i can get?'
        ],
        intentName: 'Sup: How much home can I afford?',
        intentId: 'projects/ccai-360/locations/global/agent/intents/288121b8-d0d5-4794-8c40-0e4a2f604784',
        answer: `We recommend keeping your monthly mortgage payment to 25% or less of your monthly take-home pay. For example, if you bring home $5,000 a month, your monthly mortgage payment should be no more than $1,250. E.g. It means you can afford a $211,000 home on a 15-year fixed-rate loan with a 20% down payment.
        With a conservative monthly mortgage payment, you’ll have room in your budget to cover additional costs of homeownership, like repairs and maintenance, while saving for other financial goals, including retirement.`
    },
    {
        question: [
            'How much should I save for a down payment?',
            'How much should I put down?',
            'How much should I put down on a new home?',
            'Can I put my own money in?'
        ],
        intentName: 'Sup: Down payment',
        intentId: 'projects/ccai-360/locations/global/agent/intents/06d135ce-511a-45c7-915d-8a0b5e0e0142',
        answer: `We recommend putting at least 10% down on a home, but 20% is even better because you won’t have to pay private mortgage insurance (PMI). PMI is an extra cost added to your monthly payment that doesn’t go toward paying off your mortgage.`
    }, 
    {
        question: [
            'How do interest rates affect your mortgage?',
            'What are interest rates and how does it affect my mortgage?',
            'Interest Rates?'
        ],
        intentName: 'Sup: Interest rates affect mortgage',
        intentId: 'projects/ccai-360/locations/global/agent/intents/dd0c51bb-cb74-4357-9206-d277e625e599',
        answer: `High interest rates bring higher monthly payments and increase the overall interest you’ll pay over the life of your loan. A low interest rate saves you money in both the short and long term.
        Of course, just like you can’t time the stock market, it’s nearly impossible to time your home purchase with the best interest rates. The past five years have held some of the most affordable interest rates ever, according to the Federal Home Loan Mortgage Corporation, and their recent forecast predicts the trend will continue.1
        It may be hard to time your home purchase with the best interest rates, but there are things you can do to get a lower rate. For example, a benefit of the 15-year, fixed mortgage is that it has a lower interest rate than a 30-year, fixed mortgage. Sometimes a bigger down payment can also help you get a better interest rate.
        The money you pay in interest doesn’t ever go toward paying off the principal balance of your home. That’s why it’s a smart move to get a low interest rate on your mortgage and then pay off your house as quickly as you can.`
    },
    {
        question: [
            'How do you lock your interest rate?',
            'Can you lock an interest rate?',
            'Is it possible to lock the interest rate?',
            'With the interest rate being so low at the moment, is there a possibility to lock it?'
        ],
        intentName: 'Is it possible to lock the interest rate?',
        intentId: 'projects/ccai-360/locations/global/agent/intents/f24edd5e-8793-4a17-b87f-18e8ae88260d',
        answer: `Because mortgage interest rates can change day to day, locking your rate is an important part of the mortgage process. Locking your interest rate guarantees a certain interest rate for a specific period of time, usually between 30 and 60 days.
        In most cases, you can lock your interest rate as soon as your initial loan is approved. However, most buyers wait until they have found a specific home to purchase and are officially under contract.`
    },
    {
        question: [
            'What are mortgage points?',
            'Do you have discount points?',
            'How do mortgage points work?'
        ],
        intentName: 'Sup: What are mortgage points?',
        intentId: 'projects/ccai-360/locations/global/agent/intents/288121b8-d0d5-4794-8c40-0e4a2f604784',
        answer: `Mortgage points, or discount points, are a way to prepay interest to get a lower interest rate on your mortgage.
        Each mortgage point equals 1% of your home’s value. That means if you’re getting a $250,000 loan and have two discount points, you’ll pay $5,000. In most cases, a point can reduce your interest rate by one-eighth to one-quarter of a percent.`
    },
    {
        question: [
            'What does your mortgage payment include?',
            'What is included in the mortgage?',
            'What else is included in the mortgage payment?'
        ],
        intentName: 'Sup: mortgage payment include',
        intentId: 'projects/ccai-360/locations/global/agent/intents/bb7c7f6b-3a18-4563-a138-9f5b619a3887',
        answer: `Your monthly payment actually goes toward a lot of things. A typical monthly mortgage payment includes:
        Principal, Interest, Homeowners insurance, Property taxes
        and Private mortgage insurance (PMI) if you put down less than 20% on your home.
        If you want to pay more on your mortgage, be sure to specify that you want any extra money to go toward the principal only, not an advance payment that prepays interest.`
    },
    {
        question: [
            'What is an escrow account, and how does it work?',
            'I heard about escrow accounts, what is that?',
            'how does an escrow account work?'
        ],
        intentName: 'Sup: escrow accounts',
        intentId: 'projects/ccai-360/locations/global/agent/intents/e92e66e1-dad0-4819-9686-4891f35f4f4e',
        answer: `Your mortgage payment may include additional costs like your homeowner’s insurance and property taxes. These are annual expenses that are part of homeownership, and G-Mortgages is at risk if you don’t make those payments. We can add the monthly portion of each of those accounts to your mortgage payment. That money is held in an escrow account that is managed by a third party to make sure those costs are paid on time.`
    },
    {
        question: [
            'How long does it take to close on a house?',
            'How long does the process of closing on a house takes?'
        ],
        intentName: 'Sup: Close on house',
        intentId: 'projects/ccai-360/locations/global/agent/intents/8d4f0c3a-551e-49a9-b655-b26b1da7a913',
        answer: `The average time to close on a house is currently around 40 days. 4 Factors such as your loan type, your financial situation, and the length of your contract can either lengthen or shorten that time frame.`
    },  
]

// execute a session flow for each user
for(var u = 0; u<userArray.length; u++){
    var maxQuestions = Math.floor(Math.random() * questionArray.length);
    // console.log(`max questions: ${maxQuestions}`);
    // console.log(usedQuestionsArray);
    var uuid = uuidv4();
    var platform = 'web';
    var r = Math.round(Math.random());
    if ( r <= 0.2) {
        platform = 'web' // googleassistant
    } else if( r <= 0.4) {
        platform = 'web'
    } else if( r <= 0.6) {
        platform = 'phone-outbound'
    } else if(r <= 0.8){
        platform = 'phone'
    } else {
        platform = 'business-messages'
    };

    // create multiple questions per user
    for(var x=0; x<=maxQuestions; x++){
        // get a random question number
        var questionNr = Math.floor(Math.random() * questionArray.length);
        // get the question
        var question = questionArray[questionNr];
        var isFallback = false;
        if(question.intentName == 'Default Fallback Intent'){
            isFallback = true;
        }

        // add it when the question hasn't been used
            if(!usedQuestionsArray.includes(questionNr)){
                var date = new Date();
                date.setSeconds(date.getSeconds() + secondsCounter);
                var data = {    
                    "SESSION_ID": `${uuid}`,
                    "SESSION_PATH": `projects/ccai-360/agent/sessions/${uuid}`,
                    "DATE_TIME": `${date.toISOString()}`,
                    "USER_UID": `${userArray[u].uid}`,
                    "USER_COUNTRY": `${userArray[u].country}`,
                    "SENTIMENT_SCORE": Math.random() * 1,
                    "SENTIMENT_MAGNITUDE": Math.random() * 1,
                    "INTENT_DETECTION_CONFIDENCE": 1,
                    "INTENT_DETECTION_PARAMETERS": "{}",
                    "INTENT_DETECTION_IS_FALLBACK": isFallback,
                    "INTENT_DETECTION_IS_END": false,
                    "INTENT_DETECTION_IS_LIVE_AGENT": false,
                    "FUNNEL_STEP": "SUPPLEMENTAL",
                    "LANGUAGE_CODE": "en",
                    "TOOL": "v2beta1",
                    "VERTICAL": "fsi"
                }

                // console.log(`usedQuestionsArray: ${usedQuestionsArray}`);
                // console.log(questionNr);
                // console.log(!usedQuestionsArray.includes(questionNr));
            
                var questionVariant = question.question[Math.floor(Math.random() * question.question.length)];
                
                data.QUERY = questionVariant;
                data.TEXT_RESPONSE = question.answer;
                data.RESPONSE_MESSAGES = `[{'platform':'PLATFORM_UNSPECIFIED','text':{'text':["${question.answer}"]},'message':'text'}]`;
                data.INTENT_DETECTION_DISPLAYNAME = question.intentName;
                data.INTENT_DETECTION_NAME = question.intentId;
                
                data.PLATFORM = platform;
                if (platform == 'phone' || platform == 'phone-outbound') {
                    data.SPEECH_TRANSCRIPT = question.answer;
                    data.SPEECH_CONFIDENCE = Math.random() * 1;      
                }

                exportBq.push(data);
                usedQuestionsArray.push(questionNr);
                secondsCounter = secondsCounter+2;
            }
    } // end user
    usedQuestionsArray = [];
}

arrayToNdjson(exportBq).pipe(fs.createWriteStream('supplementals1.json'))
