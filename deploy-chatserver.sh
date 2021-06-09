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

bold "Renew config maps"
kubectl delete configmap chatserver-config
kubectl create configmap chatserver-config --from-env-file=backend/.env
kubectl scale deployment chatserver --replicas=0
kubectl scale deployment chatserver --replicas=1

bold "Eval the templates & deploy the containers..."
cat _cloudbuilder/chatserver-deployment.yaml | envsubst | kubectl apply -f -

