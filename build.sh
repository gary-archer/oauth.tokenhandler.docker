#!/bin/bash

######################################################################
# Set up the Token Handler to be run in Express or as lambda functions
######################################################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"
rm -rf resources

#
# Download SSL certificates
#
rm -rf certs
git clone https://github.com/gary-archer/oauth.developmentcertificates ./resources/certs
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading API certificates'
    exit 1
fi
cp -R resources/certs/certs ./certs

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
npm run build
if [ $? -ne 0 ]; then
  echo "Problem encountered building the Token Handler API code"
  exit 1
fi

