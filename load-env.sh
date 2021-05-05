kubectl delete configmap chatserver-config
kubectl create configmap chatserver-config --from-env-file=backend/.env
kubectl scale deployment chatserver --replicas=0
kubectl scale deployment chatserver --replicas=1