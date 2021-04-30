# install howebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# install envsubst
brew install gettext
brew link --force gettext 

bold "Set all vars..."
set -a
  source .properties
  set +a

# install kubectl
gcloud components install kubectl
gcloud container clusters get-credentials $GKE_CLUSTER --zone $REGION