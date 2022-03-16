#!/bin/bash

###############################################
# A convenience script to start the OAuth Agent
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
git clone https://github.com/gary-archer/oauth.developmentcertificates ./certs
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading API certificates'
    exit 1
fi

#
# Install API dependencies
#
rm -rf node_modules
npm install
if [ $? -ne 0 ]; then
  echo "Problem encountered installing the OAuth Agent dependencies"
  exit 1
fi

#
# Start the Express API
#
npm start
if [ $? -ne 0 ]; then
  echo "Problem encountered starting the OAuth Agent"
  exit 1
fi
