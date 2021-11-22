
var options = {
    "key": "oW3ztKUI9M)d6SwVLEOHBQ((",
}

var stackexchange = require('stackexchange');
var fs = require('fs');
var unfinishedFlows = true;
var options = { version: 2.2 };
var context = new stackexchange(options);

var questions_filter = {
  key: options.key,
  pagesize: 100,
  tagged: '[dialogflow-cx]',
  sort: 'week', //hot, week, month, votes, creation, activity
  site: 'stackoverflow',
  filter: 'withbody',
  order: 'desc'
};

var answers_filter = {
    key: options.key,
    sort: 'activity',
    site: 'stackoverflow',
    filter: 'withbody',
};

var questions_collection = [];

// Get all the questions (http://api.stackexchange.com/docs/questions)
context.questions.questions(questions_filter, function(err, results){
  if (err) throw err;
  if(results.items == null || results == null) throw 'exceed limits';

  results.items.forEach(function(question, index){
    var q = {};
    q.is_answered = question.is_answered;
    q.view_count = question.view_count;
    q.creation_date = question.creation_date;
    q.question_id = question.question_id;
    q.link = question.link;
    q.title = question.title;
    q.body = question.body.replace(/<[^>]*>?/gm, '');
    q.answers = [];
    questions_collection.push(q);
    if(index == questions_collection.length-1){
        fetchAnswers();
    }
  });
});

function fetchAnswers(){
    questions_collection.forEach(function(question, index){
        if(question.is_answered){
            context.questions.answers(answers_filter, function(err, results){
                if (err) throw err;
                results.items.forEach(function(answer, x){
                    var a = {};
                    a.is_accepted = answer.is_accepted;
                    a.score = answer.score;
                    a.creation_date = answer.creation_date;
                    a.answer_id = answer.answer_id;
                    a.body = answer.replace(/<[^>]*>?/gm, '');
                    questions_collection[index].answers.push(a);
                });
            }, [questions_collection[index].question_id]);
        }

        if(index == questions_collection.length-1){
            returnResults();
        }
    });
}

function returnResults(){
    questions_collection.forEach(function(q, i){
        var obj = {
            "categories":[
            {
                "display_name":"Stackoverflow"
            },
            {
                "display_name":"[dialogflow-cx]"
            },
            {
                "display_name":q.question_id
            },
            {
                "display_name":q.title
            },
            {
                "display_name":q.link
            },
            {
                "display_name":"#views=" + q.view_count
            },
            {
                "display_name":"#answers=" + q.answers.length
            },
            ],
            "entries": []
        }

        obj.entries.push(
            {
                "text": q.title,
                "user_id": 1,
                "start_timestamp_usec": q.creation_date,
                "role": "CUSTOMER"
            }
        );

        if(q.is_answered){
            q.answers.forEach(function(a, x){
                obj.entries.push({
                    "text": a.body,
                    "user_id": 2,
                    "start_timestamp_usec": a.creation_date,
                    "role": "AGENT"
                });
            });
        }

    //Convert it from an object to a string with JSON.stringify
    var json = JSON.stringify(obj);

    // Write the file
    fs.writeFile(`${questions_collection[i].question_id}.json`, json, 'utf8', function(){
        console.log(`Created file.`);
    });
  });
}












