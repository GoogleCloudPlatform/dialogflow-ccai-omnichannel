node sms.js
node web.js
gsutil cp question* gs://insights-questions/

## move all the objects that start with sms to an own bucket
gsutil mv gs://insights-examples/question* gs://insights-questions/ 

gsutil mv gs://insights-questions/question*.json gs://insights-temp/ 

## Run these commands in the Cloud shell
# https://cloud.google.com/contact-center/insights/docs/import
gsutil cp -r gs://dialogflow-docs-downloads/contact-center-insights-preview .
virtualenv venv
source venv/bin/activate
 cd contact-center-insights-preview/
python3 -m pip install --user --upgrade pip
pip install -r requirements.txt
python3 import_conversations.py --source_chat_transcript_gcs_bucket insights-examples ccai-360

gsutil mv gs://insights-questions/question*.json gs://insights-temp/ 

python3 import_conversations.py --source_chat_transcript_gcs_bucket insights-temp --agent_id VIRTUAL-AGENT-QA ccai-360

gs://insights-questions/question-0.json

## Speech demo
curl -s -H "Content-Type: application/json" \
    -H "Authorization: Bearer "$(gcloud auth application-default print-access-token) \
    https://speech.googleapis.com/v1p1beta1/speech:recognize \
    -d @speech-demo/request.json
