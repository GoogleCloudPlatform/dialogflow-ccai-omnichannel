var fs = require('fs');
var max = 10;
var unfinishedFlows = true;

for(var i = 0; i<max; i++) {
    var obj = {
        "categories":[
        {
            "display_name":"Web"
        },
        {
            "display_name":"Mortgage Consultation"
        },
        {
            "display_name":"APPOINTMENT_SCHEDULING"
        }    
        ],
        "entries": []
    }

    obj.entries.push(
        {
            "text": "Welcome to G-Mortgages. I see that you have prequalified for a fixed rate mortgage. Would you like me to book an appointment?",
            "user_id": 2,
            "start_timestamp_usec": 1000000,
            "role": "AGENT"
        }
    );


    // and here comes the variable text part...

    //answer 1:
    var string1Array = [
        'Yes that would be great',
        'Yes please',
        'Yeah',
        'Yes.',
        'That would be great',
        'Let\'s meet',
        'Yes, let\'s book it.',
        'Ok.',
        'Okay',
        'Alright',
        'I guess',
        'Yes because I have some questions about my mortgage',
        'I have questions, so yes that would be nice',
        'That would be nice.',
        'Please!'
    ]

    var r = string1Array[Math.floor(Math.random() * string1Array.length)];

    var rDate = randomDate(new Date(), new Date().getMonth()+1, 0, 24);

    obj.entries.push(
        {
            "text": r,
            "user_id": 1,
            "start_timestamp_usec": 2000000,
            "role": "CUSTOMER"
        },
        {
            "text": "I can schedule a mortgage consultation with Mr. Gerrit Oogle.",
            "user_id": 2,
            "start_timestamp_usec": 3000000,
            "role": "AGENT"
        },
        {
            "text": rDate,
            "user_id": 2,
            "start_timestamp_usec": 3200000,
            "role": "AGENT"
        },
        {
            "text": "Would that work for you?",
            "user_id": 2,
            "start_timestamp_usec": 3500000,
            "role": "AGENT"
        },
    );

    if(!unfinishedFlows){
    var string2Array = [
        'Yes that would be great',
        'Yes please',
        'Yeah',
        'Yes.',
        'That would be great',
        'Ok.',
        'Okay',
        'Alright',
        'I guess',
        'That works',
        'I can make it',
        'That time works for me'
    ]

    r = string2Array[Math.floor(Math.random() * string2Array.length)];
    obj.entries.push(
        {
            "text": r,
            "user_id": 1,
            "start_timestamp_usec": 4000000,
            "role": "CUSTOMER"
        },
        {
            "text": `Perfect, you'll have a mortgage appointment for ${rDate} with Mr. Gerrit Oogle.`,
            "user_id": 2,
            "start_timestamp_usec": 5000000,
            "role": "AGENT"
        },{
            "text": "You will receive a text confirmation for the virtual appointment via text.",
            "user_id": 2,
            "start_timestamp_usec": 5100000,
            "role": "AGENT"
        },
        {
            "text": "Is there anything else I can help you with?",
            "user_id": 2,
            "start_timestamp_usec": 5200000,
            "role": "AGENT"
        }
    );

    var string3Array = [
        'No thanks',
        'No',
        'No that\s it',
        'Not for now',
        'Nope, thank you',
        'No thank you'
    ]

    r = string3Array[Math.floor(Math.random() * string3Array.length)];

    obj.entries.push(
        {
            "text": r,
            "user_id": 1,
            "start_timestamp_usec": 7000000,
            "role": "CUSTOMER"
        },
        {
            "text": "Thank you for contacting G-Mortgages. Have a nice day!",
            "user_id": 2,
            "start_timestamp_usec": 9000000,
            "role": "AGENT"
        }
    );
    }

    //Convert it from an object to a string with JSON.stringify
    var json = JSON.stringify(obj);

    // Write the file
    fs.writeFile(`conversation-${i}.json`, json, 'utf8', function(){
        //console.log(`Created file.`);
    });

}

function randomDate(start, end, startHour, endHour) {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var date = new Date(+start + Math.random() * (end - start));
    var hour = startHour + Math.random() * (endHour - startHour) | 0;
    date.setHours(hour);
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} at ${date.getHours()}:00`;
}