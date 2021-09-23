#!/bin/bash

########################################################
# Set up the Token Handler API on a development computer
########################################################

#
# Download SSL certificates
#
rm -rf .certs
git clone https://github.com/gary-archer/oauth.developmentcertificates ./.certs
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading API certificates'
    exit 1
fi

#
# Install dependencies if needed
#
rm -rf node_modules
npm install
if [ $? -ne 0 ]; then
  echo "Problem encountered installing the Token Handler API dependencies"
  exit 1
fi

#
# Set up the API gateway
#
cd api-gateway
./build.sh
if [ $? -ne 0 ]; then
  echo "Problem encountered building the API gateway"
  exit 1
fi