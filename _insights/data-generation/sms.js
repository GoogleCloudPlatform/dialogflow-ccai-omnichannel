var fs = require('fs');
require('./lib/names.js');
var max = 5000;
var selection = 1000;

for(var i = 0; i<max; i++) {
    var obj = {
        "categories":[
            {
                "display_name":"SMS"
              },
              {
                "display_name":"Mortgage Consultation"
              },
              {
                "display_name":"APPOINTMENT_CONFIRMED"
              }    
        ],
        "entries": []
    }

    var name = firstNames[Math.floor(Math.random() * firstNames.length)];
    var rDate = randomDate(new Date(), new Date().getMonth()+1, 0, 24);

    obj.entries.push(
        {
            "text": `Hi ${name}. Thank you for scheduling an appointment with G-Mortgages. Your virtual consultation with a licensed broker has been set for ${rDate[0]}. Feel free to reply, if you want to re-schedule your appointment.`,
            "user_id": 2,
            "start_timestamp_usec": 100000,
            "role": "AGENT"         
        },
    );

    if(i < selection){
        selection--;
    
        // and here comes the variable text part...

        //answer 1:
        var string1Array = [
            'Can we make it 30min later?',
            'I would like to have it later',
            'I can\'t make it anymore.',
            'Oops, I forgot, I am double booked',
            'I would like to change the time',
            'I need a different time',
            'Can we move it a half hour later?',
            'Later please!',
            'How about a half hour later?',
            'Reschedule',
            'Can we reschedule?',
            'Ah, that doesn\'t work anymore.'
        ]

        var r = string1Array[Math.floor(Math.random() * string1Array.length)];

    obj.entries.push(
        {
            "text": r,
            "user_id": 1,
            "start_timestamp_usec": 500000,
            "role": "AGENT"
        },
        {
            "text": `Ok, your appointment is set for ${rDate[1]}.`,
            "user_id": 2,
            "start_timestamp_usec": 700000,
            "role": "AGENT"
        }
        );
    }

    //Convert it from an object to a string with JSON.stringify
    var json = JSON.stringify(obj);

    // Write the file
    fs.writeFile(`sms-${i}.json`, json, 'utf8', function(){
        //console.log(`Created file.`);
    });

}

function randomDate(start, end, startHour, endHour) {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    var date = new Date(+start + Math.random() * (end - start));
    var hour = startHour + Math.random() * (endHour - startHour) | 0;
    var d = days[date.getDay()];
    var m = months[date.getMonth()];
    var h = hour;

    return [
        `${d}, ${m} ${date.getDate()} at ${h}:00`,
        `${d}, ${m} ${date.getDate()} at ${hour}:30`,
    ];
}