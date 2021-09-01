# Lint as: python3
"""Imports conversations into Contact Center AI Insights.

Accepts either a local audio file or a GCS bucket of source audio files.
In the latter case, assumes that every file has the same audio properties.

Transcripts will be uploaded to the specified destination GCS bucket, and they
will be named with the same basename as the corresponding audio file.

For every audio file, a corresponding conversation will be created in Insights.
Additionally, conditional on the `--analyze` flag, each conversation will also
be analyzed a single time. This allows the user to observe the results of
analysis after the script completes.

TODO(b/149255107): Add test coverage.
"""

import argparse
import os
import time
import requests

import google.auth
from google.auth import impersonated_credentials
import google.auth.transport.requests
from google.cloud import speech_v1p1beta1
from google.cloud import storage
import google.cloud.dlp
from google.cloud.speech_v1p1beta1 import enums


def _ParseArgs():
  """Parse script arguments."""

  parser = argparse.ArgumentParser()

  # Create a groups of args where exactly one of them must be set.
  source_group = parser.add_mutually_exclusive_group(required=True)
  source_group.add_argument(
      '--source_local_audio_path',
      help=('Path to a local audio file to process as input.'))
  source_group.add_argument(
      '--source_audio_gcs_bucket',
      help=(
          'Path to a GCS bucket containing audio files to process as input. '
          'This bucket can be the same as the source bucket to colocate audio '
          'and transcript.'))
  source_group.add_argument(
      '--source_voice_transcript_gcs_bucket',
      help=(
          'Path to a GCS bucket containing voice transcripts to process as input.'))
  source_group.add_argument(
      '--source_chat_transcript_gcs_bucket',
      help=(
          'Path to a GCS bucket containing chat transcripts to process as input.'))

  parser.add_argument(
      '--dest_gcs_bucket',
      help=('Name of the GCS bucket that will hold resulting transcript files. '
            'Only relevant when providing audio files as input. Otherwise ignored.'))
  parser.add_argument(
      'project_id',
      help=('Project ID (not number) for the project to own the conversation.'))
  parser.add_argument(
      '--impersonated_service_account',
      help=('A service account to impersonate. If specified, then GCP requests '
            'will be authenticated using service account impersonation. '
            'Otherwise, the gcloud default credential will be used.'))
  parser.add_argument(
      '--redact', default=False, help=('Whether to redact the transcripts.'))
  parser.add_argument(
      '--analyze',
      default=True,
      help=('Whether to analyze imported conversations. Default true.'))
  parser.add_argument(
      '--insights_endpoint',
      default='contactcenterinsights.googleapis.com',
      help=('Name for the Insights endpoint to call'))
  parser.add_argument(
      '--language_code',
      default='en-US',
      help=('Language code for all imported data.'))
  parser.add_argument(
      '--encoding',
      default='LINEAR16',
      help=('Encoding for all imported data.'))
  parser.add_argument(
      '--sample_rate_hertz',
      default=0,
      type=int,
      help=(
          'Sample rate. If left out, Speech-to-text may infer it depending on '
          'the encoding.'))
  parser.add_argument(
      '--insights_api_version',
      default='v1',
      help=('Insights API version. Options include `v1` and `v1alpha1`.'))
  parser.add_argument(
      '--agent_id',
      help=(
          'Agent identifier to attach to the created Insights conversations.'))

  return parser.parse_args()


def _UploadFileToGcs(bucket_name, source_file_name, destination_blob_name,
                     project_id, impersonated_service_account):
  """Uploads a local audio file to GCS.

  Args:
    bucket_name: The name of the GCS bucket that will hold the file
    source_file_name: The name of the source file
    destination_blob_name: The name of the blob that will be uploaded to GCS.
    project_id: The project ID (not number) to use.
    impersonated_service_account: The service account to impersonate.
  """

  storage_client = storage.Client(
      project=project_id,
      credentials=_GetClientCredentials(impersonated_service_account))
  bucket = storage_client.bucket(bucket_name)
  blob = bucket.blob(destination_blob_name)
  blob.upload_from_filename(source_file_name)


def _TranscribeAsync(storage_uri, encoding, language_code, sample_rate_hertz,
                     impersonated_service_account):
  """Transcribe long audio file from Cloud Storage.

  Args:
    storage_uri: URI for audio file in Cloud Storage, e.g. gs://[BUCKET]/[FILE]
    encoding: The encoding to use for transcription
    language_code: The language code to use for transcription
    sample_rate_hertz: The sample rate of the audio
    impersonated_service_account: The service account to impersonate.

  Returns:
    The transcription operation, which can be polled until done.
  """

  encoding_map = {
      'LINEAR16':
          enums.RecognitionConfig.AudioEncoding.LINEAR16,
      'MP3':
          enums.RecognitionConfig.AudioEncoding.MP3,
      'FLAC':
          enums.RecognitionConfig.AudioEncoding.FLAC,
      'AMR':
          enums.RecognitionConfig.AudioEncoding.AMR,
      'AMR_WB':
          enums.RecognitionConfig.AudioEncoding.AMR_WB,
      'OGG_OPUS':
          enums.RecognitionConfig.AudioEncoding.OGG_OPUS,
      'SPEEX_WITH_HEADER_BYTE':
          enums.RecognitionConfig.AudioEncoding.SPEEX_WITH_HEADER_BYTE
  }

  # The recognition configuration. Assumes the audio is a two-channel phone
  # call.
  config = {
      'language_code': language_code,
      'encoding': encoding_map[encoding],
      'model': 'phone_call',
      'audio_channel_count': 2,
      'use_enhanced': True,
      'enable_separate_recognition_per_channel': True,
      'enable_automatic_punctuation': True,
      'enable_word_time_offsets': True
  }

  if sample_rate_hertz > 0:
    config['sample_rate_hertz'] = sample_rate_hertz

  client = speech_v1p1beta1.SpeechClient(
      credentials=_GetClientCredentials(impersonated_service_account))
  audio = {'uri': storage_uri}
  try:
    operation = client.long_running_recognize(config, audio)
    return operation
  except (google.api_core.exceptions.GoogleAPIError) as e:
    print('Error `{}` when scheduling async transcription for storage uri {}'
          .format(e, storage_uri))
    return None


def _Redact(transcript_response, project_id, impersonated_service_account):
  """Redacts a transcript response.

  Args:
    transcript_response: The response from transcription.
    project_id: The project ID (not number) to use for redaction.
    impersonated_service_account: The service account to impersonate.

  Returns:
    The response from transcription.
  """
  dlp = google.cloud.dlp_v2.DlpServiceClient(
      project=project_id,
      credentials=_GetClientCredentials(impersonated_service_account))
  project_path = dlp.project_path(project_id)

  # The list of types to redact. Making this too aggressive can damage word time
  # offsets. Eventually, a better solution could be determined than sending the
  # entire STT response to DLP so that only the transcript parts would be
  # potentially redacted.
  info_types = [
      'LAST_NAME', 'EMAIL_ADDRESS', 'CREDIT_CARD_NUMBER', 'DATE_OF_BIRTH',
      'PHONE_NUMBER', 'STREET_ADDRESS'
  ]
  inspect_config = {
      'info_types': [{
          'name': info_type
      } for info_type in info_types]
  }

  deidentify_config = {
      'info_type_transformations': {
          'transformations': [{
              'primitive_transformation': {
                  'character_mask_config': {
                      # Will replace PII terms with a series of '*'.
                      'masking_character': '*',
                      # Zero means no limit on characters to redact.
                      'number_to_mask': 0,
                  }
              }
          }]
      }
  }

  item = {'value': str(transcript_response)}
  response = dlp.deidentify_content(
      project_path,
      inspect_config=inspect_config,
      deidentify_config=deidentify_config,
      item=item,
  )
  return response.item.value


def _UploadTranscript(transcript_response, bucket, transcript_file_name,
                      project_id, impersonated_service_account):
  """Uploads an audio file transcript to GCS.

  Args:
    transcript_response: The response from transcription.
    bucket: The bucket that will hold the transcript
    transcript_file_name: The name of the file that will be uploaded.
    project_id: The project ID (not number) to use for redaction.
    impersonated_service_account: The service account to impersonate.
  """
  # Use an identifier that is unique across transcriptions to prevent a race.
  tmp_file = 'tmp-{}-{}'.format(bucket, transcript_file_name)
  f = open(tmp_file, 'w')
  f.write(str(transcript_response))
  f.close()
  _UploadFileToGcs(bucket, tmp_file, transcript_file_name, project_id,
                   impersonated_service_account)
  os.remove(tmp_file)


def _CreateInsightsConversation(endpoint, api_version, project,
                                gcs_audio_uri, gcs_transcript_uri,
                                agent_id,
                                impersonated_service_account, medium=None):
  """Creates a conversation in Insights.

  Args:
    endpoint: The insights endpoint to use (prod, staging, etc)
    api_version: The Insights API version to use.
    project: The number of the project that will own the conversation
    gcs_audio_uri: The uri of the GCS audio file.
    gcs_transcript_uri: The uri of the GCS transcript file.
    agent_id: An agent identifier to attach to the conversations.
    impersonated_service_account: The service account to impersonate.
    medium: The medium of the conversation. Defaults to 1 for voice.

  Returns:
    The conversation ID of the created conversation.
  """
  oauth_token = _GetOauthToken(impersonated_service_account)
  url = ('https://{}/{}/projects/{}/locations/us-central1/'
         'conversations').format(endpoint, api_version, project)
  headers = {
      'charset': 'utf-8',
      'Content-type': 'application/json',
      'Authorization': 'Bearer {}'.format(oauth_token)
  }
  data = {
      'data_source': {
          'gcs_source': {
              'transcript_uri': gcs_transcript_uri
          }
      }
  }
  if agent_id:
    data['agent_id'] = agent_id
  if gcs_audio_uri:
    data['data_source']['gcs_source']['audio_uri'] = gcs_audio_uri
  if medium:
    data['medium'] = medium

  r = requests.post(url, headers=headers, json=data)
  if r.status_code == requests.codes.ok:
    print('Successfully created conversation for transcript uri `{}` '
          'and audio uri `{}`.'.format(gcs_transcript_uri, gcs_audio_uri))
    return r.json()['name']
  else:
    r.raise_for_status()


def _GetGcsUri(bucket, object_name):
  """Returns a GCS uri for the given bucket and object.

  Args:
    bucket: The bucket in the URI.
    object_name: The name of the object.

  Returns:
    The GCS uri.
  """
  return 'gs://{}/{}'.format(bucket, object_name)


def _GetGcsUris(bucket, project_id, impersonated_service_account):
  """Returns a list of GCS uris for files in a bucket.

  Args:
    bucket: The GCS bucket.
    project_id: The project ID (not number) to use.
    impersonated_service_account: The service account to impersonate.

  Returns:
    The GCS uris.
  """
  uris = []
  storage_client = storage.Client(
      project=project_id,
      credentials=_GetClientCredentials(impersonated_service_account))
  blobs = storage_client.list_blobs(bucket)
  for blob in blobs:
    # Blobs ending in slashes are actually directory paths.
    if not blob.name.endswith('/'):
      uris.append(_GetGcsUri(bucket, blob.name))
  return uris


def _GetClientCredentials(impersonated_service_account):
  """Gets client credentials for GCP requests.

  If an account to impersonate is provided, then it will
  be used rather than the default. Otherwise, default gcloud
  credentials will be used.

  Args:
    impersonated_service_account: The service account to impersonate.

  Returns:
    A credential for requests to GCP.
  """
  creds, _ = google.auth.default(
      scopes=['https://www.googleapis.com/auth/cloud-platform'])
  if not impersonated_service_account:
    return creds

  target_scopes = ['https://www.googleapis.com/auth/cloud-platform']
  target_credentials = impersonated_credentials.Credentials(
      source_credentials=creds,
      target_principal=impersonated_service_account,
      target_scopes=target_scopes,
      lifetime=3600)
  # Override the source credentials so refresh will work.
  # See https://github.com/googleapis/google-auth-library-python/issues/416.
  target_credentials._source_credentials._scopes = creds.scopes
  return target_credentials


def _GetOauthToken(impersonated_service_account):
  """Gets an oauth token to use for HTTP requests to GCP.

  Assumes usage of Gcloud credentials.

  Args:
    impersonated_service_account: The service account to impersonate.

  Returns:
    The oauth token.
  """
  creds = _GetClientCredentials(impersonated_service_account)
  auth_req = google.auth.transport.requests.Request()
  creds.refresh(auth_req)
  return creds.token


def _GetTranscribeAsyncCallback(project_id, dest_bucket, audio_uri,
                                insights_endpoint,
                                api_version,
                                should_redact, agent_id,
                                conversation_names,
                                impersonated_service_account):
  """A callback for asynchronous transcription.

  Args:
    project_id: The GCP project ID (not number) to hold the Insights
      conversation object.
    dest_bucket: The destination GCS bucket for the transcript file.
    audio_uri: The uri of the audio file that was transcribed.
    insights_endpoint: The endpoint for the Insights API.
    api_version: The Insights API version to use.
    should_redact: Whether to redact the transcription before saving.
    agent_id: An agent identifier to attach to the conversations.
    conversation_names: The list of conversation IDs created.
    impersonated_service_account: The service account to impersonate.

  Returns:
    The callback for asynchronous transcription.
  """

  def Callback(future):
    try:
      response = future.result()
    except google.api_core.exceptions.GoogleAPICallError as e:
      print(
          'Error `{}`: failed to transcribe audio uri `{}` with operation `{}` and '
          'error `{}`.'.format(e, audio_uri, future.operation.name,
                               future.exception()))
      return

    try:
      if should_redact:
        response = _Redact(response, project_id, impersonated_service_account)
    except google.api_core.exceptions.GoogleAPICallError as e:
      print('Error `{}`: failed to redact transcription from audio uri `{}`.'
            .format(e, audio_uri))
      return

    try:
      transcript_name = '{}.txt'.format(
          os.path.basename(os.path.splitext(audio_uri)[0]))
      _UploadTranscript(response, dest_bucket, transcript_name, project_id,
                        impersonated_service_account)
    except google.api_core.exceptions.GoogleAPICallError as e:
      print('Error `{}`: failed to upload transcription from audio uri `{}`.'
            .format(e, audio_uri))
      return

    try:
      transcript_uri = _GetGcsUri(dest_bucket, transcript_name)
      conversation_name = _CreateInsightsConversation(
          insights_endpoint, api_version, project_id, audio_uri, transcript_uri,
          agent_id, impersonated_service_account)
      # Note: Appending to a python list is thread-safe, hence no lock.
      conversation_names.append(conversation_name)

    except requests.exceptions.HTTPError as e:
      print('Error `{}`: failed to create insights conversation from audio uri '
            '{} and transcript uri `{}`.'.format(e, audio_uri, transcript_uri))

  return Callback

def _ImportConversationsFromTranscript(transcript_uris, project_id, medium,
                                     insights_endpoint, api_version,
                                     should_redact, agent_id,
                                     impersonated_service_account):
  """Create conversations in Insights for a list of transcript uris.

  Args:
    transcript_uris: The transcript uris for which conversations should be created.
    project_id: The project ID (not number) to use for redaction and Insights.
    medium: The medium (1 for voice, 2 for chat).
    insights_endpoint: The Insights endpoint to send requests.
    api_version: The Insights API version to use.
    should_redact: Whether to redact transcriptions with DLP.
    agent_id: An agent identifier to attach to the conversations.
    impersonated_service_account: The service account to impersonate.

  Returns:
    A list of conversations IDs for the created conversations.
  """
  conversation_names = []
  for transcript_uri in transcript_uris:
    conversation_name = _CreateInsightsConversation(
	insights_endpoint, api_version, project_id, None, transcript_uri,
    agent_id, impersonated_service_account, medium)
    conversation_names.append(conversation_name)

    # Sleep to avoid exceeding Insights quota.
    time.sleep(1)

  return conversation_names

def _ImportConversationsFromAudio(audio_uris, encoding, language_code,
                                     sample_rate_hertz, project_id, dest_bucket,
                                     insights_endpoint, api_version,
                                     should_redact, agent_id,
                                     impersonated_service_account):
  """Create conversations in Insights for a list of audio uris.

  Args:
    audio_uris: The audio uris for which conversations should be created.
    encoding: The language encoding for Speech-to-text.
    language_code: The language code for Speech-to-text.
    sample_rate_hertz: The sample rate of the audios.
    project_id: The project ID (not number) to use for transcription, redaction,
      and Insights.
    dest_bucket: The destination GCS bucket for transcriptions.
    insights_endpoint: The Insights endpoint to send requests.
    api_version: The Insights API version to use.
    should_redact: Whether to redact transcriptions with DLP.
    agent_id: An agent identifier to attach to the conversations.
    impersonated_service_account: The service account to impersonate.

  Returns:
    A list of conversations IDs for the created conversations.
  """
  conversation_names = []
  operations = []
  for audio_uri in audio_uris:
    operation = _TranscribeAsync(audio_uri, encoding, language_code,
                                 sample_rate_hertz,
                                 impersonated_service_account)
    if not operation:
      continue

    operation.add_done_callback(
        _GetTranscribeAsyncCallback(project_id, dest_bucket, audio_uri,
                                    insights_endpoint, api_version, should_redact,
                                    agent_id,
                                    conversation_names,
                                    impersonated_service_account))
    operations.append(operation)

    # Sleep to avoid exceeding Speech-to-text quota.
    time.sleep(2)

  num_operations = len(operations)
  print('Successfully scheduled `{}` transcription operations.'.format(
      num_operations))
  while operations:
    operations = [operation for operation in operations if not operation.done()]
    if not operations:
      break

    print('Still waiting for `{}` transcription operations to complete'.format(
        len(operations)))
    # Sleep to avoid exceeding Speech-to-text quota.
    time.sleep(5)

  print('Finished waiting for all `{}` transcription operations.'.format(
      num_operations))

  return conversation_names


# TODO(b/149255107): Have a max wait time and return successful IDs.
def _AnalyzeConversations(conversation_names, insights_endpoint,
                          api_version,
                          impersonated_service_account):
  """Analyzes the provided list of conversations.

  Args:
    conversation_names: The list of conversations to analyze.
    insights_endpoint: The Insights endpoint to call.
    api_version: The Insights API version to use.
    impersonated_service_account: The service account to impersonate.
  """
  analysis_operations = []
  oauth_token = _GetOauthToken(impersonated_service_account)
  headers = {
      'charset': 'utf-8',
      'Content-type': 'application/json',
      'Authorization': 'Bearer {}'.format(oauth_token)
  }

  for conversation_name in conversation_names:
    try:
      url = 'https://{}/{}/{}/analyses'.format(insights_endpoint, api_version,
                                                     conversation_name)
      r = requests.post(url, headers=headers)
      print('Started analysis for conversation `{}`'.format(conversation_name))
      # Sleep to avoid exceeding Create Analysis quota in Insights.
      time.sleep(2)

      if r.status_code == requests.codes.ok:
        analysis_operations.append(r.json()['name'])

      else:
        r.raise_for_status()
    except requests.exceptions.HTTPError as e:
      print(
          'Error `{}`: failed to create analysis for conversation `{}`.'.format(
              e, conversation_name))
  print('Successfully scheduled `{}` analysis operations: {}'.format(
      len(analysis_operations), analysis_operations))

  finished_operations = []
  while len(finished_operations) < len(analysis_operations):
    for analysis_operation in analysis_operations:
      try:
        url = 'https://{}/{}/{}'.format(insights_endpoint,
                                        api_version,
                                        analysis_operation)
        r = requests.get(url, headers=headers)
        if r.status_code == requests.codes.ok:
          json = r.json()
          if 'done' in json and json['done']:
            finished_operations.append(analysis_operation)
        else:
          r.raise_for_status()
      except requests.exceptions.HTTPError as e:
        print('Error `{}`: failed to poll analysis operation `{}`.'.format(
            e, analysis_operation))
      time.sleep(1)
    time.sleep(5)

  print('All `{}` analysis operations have finished.'.format(
      len(analysis_operations)))


def main():
  pargs = _ParseArgs()
  project_id = pargs.project_id
  impersonated_service_account = pargs.impersonated_service_account
  insights_endpoint = pargs.insights_endpoint
  api_version = pargs.insights_api_version
  should_redact = pargs.redact
  agent_id = pargs.agent_id

  if pargs.source_local_audio_path or pargs.source_audio_gcs_bucket:
    # Inputs are audio files.
    dest_bucket = pargs.dest_gcs_bucket

    if pargs.source_local_audio_path:
      source_local_audio_path = pargs.source_local_audio_path
      source_audio_base_name = os.path.basename(source_local_audio_path)
      _UploadFileToGcs(dest_bucket, source_local_audio_path,
		       source_audio_base_name, project_id,
		       impersonated_service_account)
      audio_uris = [_GetGcsUri(dest_bucket, source_audio_base_name)]
    elif pargs.source_audio_gcs_bucket:
      audio_uris = _GetGcsUris(pargs.source_audio_gcs_bucket, project_id,
			       impersonated_service_account)
    encoding = pargs.encoding
    language_code = pargs.language_code
    sample_rate_hertz = pargs.sample_rate_hertz

    conversation_names = _ImportConversationsFromAudio(
	audio_uris, encoding, language_code, sample_rate_hertz, project_id,
	dest_bucket, insights_endpoint, api_version, should_redact, agent_id,
	impersonated_service_account)
  else:
    # Inputs are transcript files.
    if pargs.source_voice_transcript_gcs_bucket:
      medium = 1
      transcript_bucket = pargs.source_voice_transcript_gcs_bucket
    else:
      transcript_bucket = pargs.source_chat_transcript_gcs_bucket
      medium = 2
    transcript_uris = _GetGcsUris(transcript_bucket, project_id,
			     impersonated_service_account)
    conversation_names = _ImportConversationsFromTranscript(
      transcript_uris, project_id, medium, insights_endpoint,
      api_version, should_redact, agent_id,
      impersonated_service_account)

  print('Created `{}` conversation IDs: {}'.format(
      len(conversation_names), conversation_names))

  print('Starting analysis for conversations.')
  _AnalyzeConversations(conversation_names, insights_endpoint,
                        api_version, impersonated_service_account)


if __name__ == '__main__':
  main()
