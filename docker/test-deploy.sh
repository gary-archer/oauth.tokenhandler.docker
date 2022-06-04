#!/bin/bash

##############################################################
# A script to test Docker deployment on a development computer
##############################################################

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
# Download certificates if required
#
./downloadcerts.sh
if [ $? -ne 0 ]; then
  exit
fi

#
# Install dependencies
#
if [ ! -d 'node_modules' ]; then
  
  rm -rf node_modules
  npm install
  if [ $? -ne 0 ]; then
    echo "Problem encountered installing dependencies"
    exit
  fi
fi

#
# Build to the dist folder
#
npm run buildRelease
if [ $? -ne 0 ]; then
  echo 'Problem encountered building Node.js code'
  exit
fi

#
# Prepare root CA certificates that the Docker container will trust
#
cp ./certs/authsamples-dev.ca.pem docker/trusted.ca.pem

#
# On Windows, fix problems with trailing newline characters in Docker scripts
#
if [ "$PLATFORM" == 'WINDOWS' ]; then
  sed -i 's/\r$//' docker/docker-init.sh
fi

#
# Build the docker image
#
docker build -f docker/Dockerfile --build-arg TRUSTED_CA_CERTS='docker/trusted.ca.pem' -t oauthagent:v1 .
if [ $? -ne 0 ]; then
  echo 'Problem encountered building the docker image'
  exit
fi

#
# Run the docker deployment
#
docker compose --file docker/docker-compose.yml --project-name oauthagent up --force-recreate --detach
if [ $? -ne 0 ]; then
  echo "Problem encountered running Docker image"
  exit 1
fi

#
# Wait for it to become available
#
echo 'Waiting for OAuth Agent to become available ...'
WEB_ORIGIN='https://web.authsamples-dev.com'
BASE_URL='https://localtokenhandler.authsamples-dev.com:444'
while [ "$(curl -k -s -X POST -H "origin:$WEB_ORIGIN" -o /dev/null -w ''%{http_code}'' "$BASE_URL/oauth-agent/login/start")" != '200' ]; do
  sleep 2
done
