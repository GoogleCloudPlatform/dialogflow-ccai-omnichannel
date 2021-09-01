node sms.js
node web.js
gsutil cp data-generation/*.json gs://insights-examples/

## Run these commands in the Cloud shell
# https://cloud.google.com/contact-center/insights/docs/import
gsutil cp -r gs://dialogflow-docs-downloads/contact-center-insights-preview .
virtualenv venv
source venv/bin/activate
python3 -m pip install --user --upgrade pip
pip install -r requirements.txt
python3 import_conversations.py --source_chat_transcript_gcs_bucket insights-examples ccai-360


