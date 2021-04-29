 #!/bin/bash
bold() {
  echo ". $(tput bold)" "$*" "$(tput sgr0)";
}

err() {
  echo "$*" >&2;
}

bold "Set all vars..."
set -a
  source ./properties
  set +a

bold "Eval the templates & deploy..."
envsubst < _cloudbuilder/chatserver-deployment.yaml | kubectl apply -f -

bold "Create services..."
kubectl apply -f _cloudbuilder/services.yaml