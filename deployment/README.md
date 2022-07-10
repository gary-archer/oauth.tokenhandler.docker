# Deployment Resources

Deployment resources are organized into the following folders:

## docker

The main OAuth Agent and OAuth Proxy Dockerfiles used in all Docker and Kubernetes deployment scenarios.

## docker-local

Scripts to test standalone Docker deployment of the token handler components:

```bash
cd deployment/docker-local
./build.sh
./deploy.sh
./teardown.sh
```

## environments

A number of environments exist for various setups, with different configuration files:

| Environment | Description |
| ----------- | ----------- |
| dev | Local development of the OAuth Agent component |
| docker-local | A deployment of the OAuth Agent and OAuth Proxy to support local SPA to API routing |
| kubernetes-local | A deployment of the OAuth Agent and OAuth Proxy for an end-to-end KIND setup |

## kubernetes

Resources used in all Kubernetes deployment scenarios.

## kubernetes-local

Scripts for deploying this component in an end-to-end local KIND setup.
