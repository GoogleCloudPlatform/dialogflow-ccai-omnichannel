kubectl create configmap chatserver-config --from-env-file=backend/.env
kubectl scale deployment chat --replicas=0 -n service
kubectl scale deployment chat --replicas=1 -n service