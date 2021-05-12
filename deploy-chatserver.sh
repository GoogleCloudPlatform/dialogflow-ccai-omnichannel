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
gcloud builds submit --config _cloudbuilder/chatserver.yaml

bold "Remove old deployments"
kubectl delete deployment chatserver

bold "Eval the templates & deploy the containers..."
cat _cloudbuilder/chatserver-deployment.yaml | envsubst | kubectl apply -f -

