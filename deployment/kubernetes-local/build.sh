#!/bin/bash

##################################################
# Build the OAuth Agent's code into a Docker image
##################################################

#
# Ensure that we are in the root folder
#
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ../..

#
# Get the platform
#
case "$(uname -s)" in

  Darwin)
    PLATFORM="MACOS"
 	;;

  MINGW64*)
    PLATFORM="WINDOWS"
	;;

  Linux)
    PLATFORM="LINUX"
	;;
esac

#
# Build the OAuth Agent code
#
npm install
npm run buildRelease
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent build problem encountered'
  exit 1
fi

#
# Initialize extra trusted certificates to zero
#
touch deployment/kubernetes-local/trusted.ca.pem

#
# On Windows, fix problems with trailing newline characters in Docker scripts
#
if [ "$PLATFORM" == 'WINDOWS' ]; then
  sed -i 's/\r$//' deployment/docker/oauthagent/docker-init.sh
fi

#
# Build the Docker container
#
docker build --no-cache -f deployment/docker/oauthagent/Dockerfile --build-arg TRUSTED_CA_CERTS='deployment/kubernetes-local/trusted.ca.pem' -t oauthagent:v1 .
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent docker build problem encountered'
  exit 1
fi

#
# Load it into kind's Docker registry
#
kind load docker-image oauthagent:v1 --name oauth
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent docker deploy problem encountered'
  exit 1
fi

#
# Build the docker image for the Kong API Gateway, which hosts the OAuth Proxy plugin
#
docker build --no-cache -f deployment/docker/apigateway/Dockerfile -t apigateway:v1 .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API Gateway docker image'
  exit 1
fi

#
# Load it into kind's Docker registry
#
kind load docker-image apigateway:v1 --name oauth
if [ $? -ne 0 ]; then
  echo '*** API Gateway docker deploy problem encountered'
  exit 1
fi