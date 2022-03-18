#!/bin/bash

###############################################
# A convenience script to build the OAuth Agent
###############################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"
rm -rf resources

#
# Download SSL certificates
#
rm -rf certs
git clone https://github.com/gary-archer/oauth.developmentcertificates ./resources
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading OAuth Agent certificates'
    exit 1
fi

#
# Move OAuth Agent certificates to this folder
#
rm -rf certs
mv ./resources/authsamples-dev ./certs
rm -rf ./resources

#
# Install API dependencies
#
rm -rf node_modules
npm install
if [ $? -ne 0 ]; then
  echo "Problem encountered installing the OAuth Agent dependencies"
  exit 1
fi

