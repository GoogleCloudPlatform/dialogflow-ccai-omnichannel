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

bold "Secrets"
kubectl create secret generic chatserver-config --from-env-file=backend/.env
kubectl create secret generic credentials --from-file=master.json

bold "Build container & push to registry"
gcloud builds submit --config _cloudbuilder/setup.yaml

bold "Eval the templates & deploy the containers..."
kubectl apply -f _cloudbuilder/chatserver-deployment.yaml
kubectl apply -f _cloudbuilder/web-deployment.yaml

bold "Create services..."
kubectl apply -f _cloudbuilder/services.yaml

bold "Create a static IP"
gcloud compute --project=$PROJECT_ID addresses create $GKE_CLUSTER --global --network-tier=PREMIUM