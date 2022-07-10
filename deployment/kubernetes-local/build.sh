#!/bin/bash

##################################################
# Build the OAuth Agent's code into a Docker image
##################################################

#
# Ensure that we are in the root folder
#
cd "$(dirname "${BASH_SOURCE[0]}")"
cd ..

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
# Get the OAuth Agent API
#
rm -rf oauth-agent
git clone https://github.com/gary-archer/oauth.tokenhandler.docker oauth-agent
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent download problem encountered'
  exit 1
fi

#
# Build its code
#
cd oauth-agent
npm install
npm run buildRelease
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent build problem encountered'
  exit 1
fi

#
# Initialize extra trusted certificates to zero
#
touch docker/trusted.ca.pem

#
# On Windows, fix problems with trailing newline characters in Docker scripts
#
if [ "$PLATFORM" == 'WINDOWS' ]; then
  sed -i 's/\r$//' docker/docker-init.sh
fi

#
# Build the Docker container
#
docker build --no-cache -f docker/Dockerfile --build-arg TRUSTED_CA_CERTS='docker/trusted.ca.pem' -t oauthagent:v1 .
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
