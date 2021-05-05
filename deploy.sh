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

bold "Remove old deployments"
kubectl delete deployment chatserver
kubectl delete deployment web

bold "Eval the templates & deploy the containers..."
# https://stackoverflow.com/questions/23620827/envsubst-command-not-found-on-mac-os-x-10-8
cat _cloudbuilder/chatserver-deployment.yaml | envsubst | kubectl apply -f -
cat _cloudbuilder/web-deployment.yaml | envsubst | kubectl apply -f -

bold "Create services..."
kubectl delete -f _cloudbuilder/services.yaml
kubectl apply -f _cloudbuilder/services.yaml

bold "Create loadbalancer / Ingress..."
kubectl delete -f _cloudbuilder/loadbalancer.yaml
cat _cloudbuilder/loadbalancer.yaml | envsubst | kubectl apply -f -

