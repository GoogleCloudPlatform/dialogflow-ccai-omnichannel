 #!/bin/bash
bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

bold "Set all vars..."
set -a
  source .properties
  set +a

bold "Create a cluster for project:" $PROJECT_ID
gcloud container clusters create $GKE_CLUSTER --region $REGION --num-nodes $TOTAL_NODES --min-nodes $MIN_NODES --max-nodes $MAX_NODES

bold "Download service account key"
gcloud iam service-accounts keys create master.json --iam-account=$SA_EMAIL

bold "Create Secrets & Config maps"
kubectl create configmap chatserver-config --from-env-file=backend/.env
kubectl create secret generic credentials --from-file=master.json

bold "Build container & push to registry"
gcloud builds submit --config _cloudbuilder/setup.yaml

bold "Eval the templates & deploy the containers..."
# https://stackoverflow.com/questions/23620827/envsubst-command-not-found-on-mac-os-x-10-8
cat _cloudbuilder/chatserver-deployment.yaml | envsubst | kubectl apply -f -
cat _cloudbuilder/web-deployment.yaml | envsubst | kubectl apply -f -

bold "Create services..."
kubectl apply -f _cloudbuilder/services.yaml

bold "Create a static IP"
gcloud compute --project=$PROJECT_ID addresses create $GKE_CLUSTER --global --network-tier=PREMIUM