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

bold "Build container & push to registry"
gcloud builds submit --config _cloudbuilder/setup.yaml

bold "Eval the templates & deploy the containers..."
kubectl apply -f _cloudbuilder/chatserver-deployment.yaml
kubectl apply -f _cloudbuilder/web-deployment.yaml

bold "Create services..."
kubectl apply -f _cloudbuilder/services.yaml

