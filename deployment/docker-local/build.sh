#!/bin/bash

##############################################################
# A script to test Docker deployment on a development computer
##############################################################

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
# Download certificates if required
#
./downloadcerts.sh
if [ $? -ne 0 ]; then
  exit 1
fi

#
# Install dependencies
#
if [ ! -d 'node_modules' ]; then
  
  rm -rf node_modules
  npm install
  if [ $? -ne 0 ]; then
    echo "Problem encountered installing dependencies"
    exit 1
  fi
fi

#
# Build to the dist folder
#
npm run buildRelease
if [ $? -ne 0 ]; then
  echo 'Problem encountered building Node.js code'
  exit 1
fi

#
# Prepare root CA certificates that the Docker container will trust
#
cp ./certs/authsamples-dev.ca.pem deployment/docker-local/trusted.ca.pem

#
# On Windows, fix problems with trailing newline characters in Docker scripts
#
if [ "$PLATFORM" == 'WINDOWS' ]; then
  sed -i 's/\r$//' deployment/docker/oauthagent/docker-init.sh
fi

#
# Build the docker image for the Kong API Gateway, which hosts the OAuth Proxy plugin
#
docker build -f deployment/docker/apigateway/Dockerfile -t custom_kong:2.8.1-alpine .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the API Gateway docker image'
  exit 1
fi

#
# Build the docker image for the OAuth Agent
#
docker build -f deployment/docker/oauthagent/Dockerfile --build-arg TRUSTED_CA_CERTS='deployment/docker-local/trusted.ca.pem' -t oauthagent:v1 .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the OAuth Agent docker image'
  exit 1
fi
