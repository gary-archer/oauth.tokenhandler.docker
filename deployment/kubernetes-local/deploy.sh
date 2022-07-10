
#!/bin/bash

###########################################################################
# Deploy the OAuth Agent API and the API Gateway that hosts the OAuth Proxy
###########################################################################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Give configuration files the name expected by code
#
cp ../environments/oauthagent/kubernetes-local.config.json api.config.json
cp ../environments/apigateway/kubernetes-local.yaml        kong.yml

#
# Create a configmap for the OAuth Agent's JSON configuration file
#
kubectl -n deployed delete configmap oauth-agent-config 2>/dev/null
kubectl -n deployed create configmap oauth-agent-config --from-file=api.config.json
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the OAuth Agent configmap'
  exit 1
fi

#
# Create a secret for the private key password of the certificate file cert-manager will create
#
kubectl -n deployed delete secret oauthagent-pkcs12-password 2>/dev/null
kubectl -n deployed create secret generic oauthagent-pkcs12-password --from-literal=password='Password1'
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the OAuth Agent certificate secret'
  exit 1
fi

#
# Trigger deployment of the OAuth Agent to the Kubernetes cluster
#
kubectl -n deployed delete -f ../kubernetes/oauthagent.yaml 2>/dev/null
kubectl -n deployed apply  -f ../kubernetes/oauthagent.yaml
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent Kubernetes deployment problem encountered'
  exit 1
fi

#
# Create the configmap for API gateway routes
#
kubectl -n deployed delete configmap kong-config 2>/dev/null
kubectl -n deployed create configmap kong-config --from-file=kong.yml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the API gateway configmap'
  exit 1
fi

#
# Trigger deployment of the API gateway to the Kubernetes cluster
#
kubectl -n deployed delete -f ../kubernetes/apigateway.yaml 2>/dev/null
kubectl -n deployed apply  -f ../kubernetes/apigateway.yaml
if [ $? -ne 0 ]; then
  echo '*** API Gateway deployment problem encountered'
  exit 1
fi
