#!/bin/bash

########################################################################################
# Set up the Token Handler to be delpoyed as Docker containers on a development computer
########################################################################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"
rm -rf dependencies

#
# Download SSL certificates
#
rm -rf certs
git clone https://github.com/gary-archer/oauth.developmentcertificates ./dependencies/certs
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading API certificates'
    exit 1
fi
cp -R dependencies/certs/localhost ./certs

#
# Download the Curity reverse proxy plugin
#
git clone https://github.com/curityio/kong-bff-plugin ./dependencies/kong-bff-plugin
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading the Curity token handler plugin'
    exit 1
fi

#
# Install API dependencies
#
rm -rf node_modules
npm install
if [ $? -ne 0 ]; then
  echo "Problem encountered installing the Token Handler API dependencies"
  exit 1
fi

#
# Build the token handler API's code
#
npm run buildRelease
if [ $? -ne 0 ]; then
  echo "Problem encountered building the Token Handler API code"
  exit 1
fi

#
# Build the API's Docker container
#
docker build -f ./Dockerfile -t tokenhandlerapi:1.0.0 .
if [ $? -ne 0 ]; then
  echo "Problem encountered building the Token Handler API Docker container"
  exit 1
fi
