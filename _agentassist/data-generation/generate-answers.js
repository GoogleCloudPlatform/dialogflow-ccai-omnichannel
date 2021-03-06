var fs = require('fs');
require('./lib/names.js');
var max = 10;
var timer = 100000;
var usedQuestionsArray = [];
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
        answer: `If you’ve paid off all your debt—and we recommend you do before buying a home—it is possible you won’t have a credit score. Don’t worry; you can still get a mortgage.
                 If you apply for a mortgage without a credit score, you’ll need to go through a process called manual underwriting. Manual underwriting simply means you’ll be asked to provide additional paperwork for the underwriter to review personally. 
                 Your loan process may take a little longer, but buying a home without the strain of extra debt is worth it!`
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
        answer: `We recommend putting at least 10% down on a home, but 20% is even better because you won’t have to pay private mortgage insurance (PMI). PMI is an extra cost added to your monthly payment that doesn’t go toward paying off your mortgage.`
    }, 
    {
        question: [
            'How do interest rates affect your mortgage?',
            'What are interest rates and how does it affect my mortgage?',
            'Interest Rates?'
        ],
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
        answer: `Because mortgage interest rates can change day to day, locking your rate is an important part of the mortgage process. Locking your interest rate guarantees a certain interest rate for a specific period of time, usually between 30 and 60 days.
        In most cases, you can lock your interest rate as soon as your initial loan is approved. However, most buyers wait until they have found a specific home to purchase and are officially under contract.`
    },
    {
        question: [
            'Isn’t good advice too expensive for me?',
            'Is mortgage advice expensive?',
            'Should I pay for a mortgage consult?',
        ],
        answer: `Some advisors have a lower rate than others. It is therefore important to think about the difference in how that rate can be justified. Go to our rates for more information.`
    },
    {
        question: [
            'I am a starter: can I get a mortgage?',
            'Can I get a mortgage as a starter',
            'I just finished university am I able to get a mortgage?'
        ],
        answer: `When buying your first house, you are faced with plenty of new challenges. Thankfully, mortgages for your first house have become relatively more transparent since 2013. It is still important to familiarise yourself with the options. Many highly educated starters prefer to prepare themselves and already know what to expect of the financing process prior to buying a house.`
    },
    {
        question: [
            'Can I apply for a mortgage during my PhD?',
            'Can I apply for a mortgage during my study?',
        ],
        answer: `Most PhD candidates believe that it is virtually impossible to apply for a mortgage during their doctoral research. After all, temporary employment contracts are not popular among mortgage lenders. Nevertheless, there are opportunities for purchasing a home during this period. Because of the (often) good future prospects, lenders have a special policy for PhD students. Depending on your situation, there are often more possibilities than there may seem to be in advance.`
    },
    {
        question: [
            'A linear or an annuity mortgage?',
            'What is the difference between linear and annuity?',
        ],
        answer: `Choosing a mortgage type is a personal choice and we are often asked what the best option is. The linear mortgage is often considered to be cheaper, but is that really the case? And does an annuity mortgage give you more freedom? Or could the increasing costs be overwhelming?`
    },
    {
        question: [
            'How does an annuity mortgage work?',
            'What is annuity mortgage and how does it work?',
            'Annuity mortgage?'
        ],
        answer: `Your total monthly payments remain the same
        The sum you are paying off increases all the time
        The interest decreases all the time
        Financially, you are better off during the first years (compared to a linear mortgage)`
    },
    {
        question: [
            'Life Insurance what are the benefits?',
            'What are the benefits of life insurance?',
            'Should I take life insurance?'
        ],
        answer: `What to look for when you want to take out a Life insurance? You’ll probably first want to see how much the premium is; how much you pay per month or per year for insurance? Anyone can look up or (have someone) calculate a premium. You will see that at different insurers the premiums are sometimes very similar to each other. Which insurer should you choose? That’s why it is always wise to know and also compare the conditions. Here the main features of life insurance are described and we will give you tips on what further to pay attention to.`
    },
    {
        question: [
            'How does a linear mortgage work?',
            'What is linear mortgage and how does it work?',
            'Linear mortgage?'
        ],
        answer: `A linear mortgage offers the following features:
        Your total monthly payments keep decreasing
        The sum you are paying off remains the same
        The interest keeps decreasing
        You pay less interest over the whole term (compared to an annuity mortgage)`
    },
    {
        question: [
            'Mortgage options: from which types of mortgages can I choose?',
            'What are the mortgage options?',
        ],
        answer: `Since 2013, mortgage interest is only tax deductible if you choose an annuity or linear mortgage. Did you have a mortgage on your home with which you were entitled to deduct interest on December 31, 2012? Then you are still entitled, under certain conditions, to deduct your mortgage interest if you have a different type of mortgage. We will explain the most common types of mortgages`
    },
    {
        question: [
            'What are mortgage points?',
            'Do you have mortgage points?'
        ],
        answer: `Mortgage points, or discount points, are a way to prepay interest to get a lower interest rate on your mortgage.
        Each mortgage point equals 1% of your home’s value. That means if you’re getting a $250,000 loan and have two discount points, you’ll pay $5,000. In most cases, a point can reduce your interest rate by one-eighth to one-quarter of a percent.`
    },
    {
        question: [
            'What does your mortgage payment include?',
            'What is included in the mortgage?',
            'What else is included in the mortgage payment?'
        ],
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
        answer: `Your mortgage payment may include additional costs like your homeowner’s insurance and property taxes. These are annual expenses that are part of homeownership, and G-Mortgages is at risk if you don’t make those payments. We can add the monthly portion of each of those accounts to your mortgage payment. That money is held in an escrow account that is managed by a third party to make sure those costs are paid on time.`
    },
    {
        question: [
            'How long does it take to close on a house?',
            'How long does the process of closing on a house takes?'
        ],
        answer: `The average time to close on a house is currently around 40 days. 4 Factors such as your loan type, your financial situation, and the length of your contract can either lengthen or shorten that time frame.`
    },  
]


for(var i = 0; i<max; i++) {
    var obj = {
        "conversation_info": {
            "categories":[
                {
                    "display_name":"Customer Questions"
                    },
                    {
                    "display_name":"General Mortgage"
                    },
                    {
                    "display_name":"SUPPLEMENTAL"
                    }    
            ],
        },
        "entries": []
    };

    var name = firstNames[Math.floor(Math.random() * firstNames.length)];
    var maxQuestions = Math.floor(Math.random() * questionArray.length);

    obj.entries.push(
        {
            "text": `Hi ${name}. How can I help?`,
            "user_id": 2,
            "start_timestamp_usec": 100,
            "role": "AGENT"         
        },
    );

    //console.log(`max questions: ${maxQuestions}`);
    //console.log(usedQuestionsArray);

    // create multiple questions
    for(var x=0; x<=maxQuestions; x++){
        var questionNr = Math.floor(Math.random() * questionArray.length);
        var question = questionArray[questionNr];
           
        if(!usedQuestionsArray.includes(questionNr)){

            //console.log(`usedQuestionsArray: ${usedQuestionsArray}`);
            //console.log(questionNr);
            //console.log(!usedQuestionsArray.includes(questionNr));

            var questionVariant = question.question[Math.floor(Math.random() * question.question.length)];
            obj.entries.push(
            {
                "text": questionVariant,
                "user_id": 1,
                "start_timestamp_usec": timer+200000,
                "role": "CUSTOMER"
            },
            {
                "text": question.answer,
                "user_id": 2,
                "start_timestamp_usec": timer+500000,
                "role": "AGENT"
            });
        
            timer = timer+500000;
            usedQuestionsArray.push(questionNr);
        }
    }

    obj.entries.push(
        {
            "text": "Is there anything else I can help you with?",
            "user_id": 2,
            "start_timestamp_usec": timer+200000,
            "role": "AGENT"
        },
        {
          "text": "No that's it for now, thank you.",
          "user_id": 1,
          "start_timestamp_usec": timer+400000,
          "role": "CUSTOMER"
        },
        {
          "text": "Thank you for contacting G-Mortgages. Have a nice day!",
          "user_id": 2,
          "start_timestamp_usec": timer+600000,
          "role": "AGENT"
      }
    );
    
    usedQuestionsArray.push(questionNr);
    timer = 100000;

    //Convert it from an object to a string with JSON.stringify
    var json = JSON.stringify(obj);
    usedQuestionsArray = [];
    // Write the file
    fs.writeFile(`_temp/answer-${i}.json`, json, 'utf8', function(){
        //console.log(`Created file.`);
    });
}

var csvArr = [];
for(var i = 0; i<max; i++){
    csvArr.push(`gs://agentassist-data/answer-${i}.json`)
}

var csvContent = "";
csvArr.forEach(function() {
    let row = csvArr.join("\r\n");
    csvContent = row + "\r\n";
});

let csv = `${csvContent}`;

// Write the file
//fs.writeFile(`_temp/q-labels.csv`, csv, 'utf8', function(){
//    console.log(`Created file.`);
//});

