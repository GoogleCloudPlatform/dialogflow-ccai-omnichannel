kubectl delete configmap chatserver-config
kubectl create configmap chatserver-config --from-env-file=backend/.env
kubectl scale deployment chat --replicas=0 -n chatserver
kubectl scale deployment chat --replicas=1 -n chatserver