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

bold "Eval the templates & deploy the containers..."
cat _cloudbuilder/chatserver-deployment.yaml | envsubst | kubectl remove -f -
cat _cloudbuilder/web-deployment.yaml | envsubst | kubectl remove -f -

bold "Create services..."
kubectl remove -f _cloudbuilder/services.yaml

bold "SSL Domain"
kubectl remove -f _cloudbuilder/domain.yaml

bold "Remove loadbalancer / Ingress..."
kubectl remove -f _cloudbuilder/loadbalancer.yaml