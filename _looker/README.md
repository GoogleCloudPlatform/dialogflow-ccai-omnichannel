### Looker

The Looker dashboard will contain the following analytics:

1) Improve Bot - Negative Customer Responses
* Get the top 10 most negative sentiment scores
* Read the full transcript what went wrong
* Check the intent confidence, to figure out if Dialogflow couldn't match
* If it was google assistant or phone, check also the speech confidence, if the input was wrongly captured.

1B) Instead of filtering on negative responses, get the 10 latest
Dialogflow fallbacks, based on is_fallback and date_time

1C) Get the top 10 on google assistant & phone where the speech confidence was low,
so we can improve the speech model

1D) Top 10, positive / negative on CSAT, CES, NPS scores

2) Find a chat transcription based on:
* date_time & platform
* a bit of text

3) Find a chat transcription across all platforms based on:
* user phone number
* user email address

4) Upsell
* Get all the userids, that have a funnel step APPOINTMENT_SCHEDULING but not APPOINTMENT_CONFIRMED
so I can proactively call these users to confirm appointments

5) TOPIC MINING
* TODO Find a transcript based on a certain topic mined keyword
