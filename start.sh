#!/bin/bash

###############################################
# A convenience script to start the OAuth Agent
###############################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"
rm -rf resources

if [ ! -d 'certs' ]; then
  
  #
  # Download SSL certificates if needed
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
fi

#
# Install API dependencies
#
if [ ! -d 'node_modules' ]; then
  
  rm -rf node_modules
  npm install
  if [ $? -ne 0 ]; then
    echo "Problem encountered installing the OAuth Agent dependencies"
    exit 1
  fi
fi

#
# Start the Express API
# On Linux first ensure that you have first granted Node.js permissions to listen on port 444:
# - sudo setcap 'cap_net_bind_service=+ep' $(which node)
#
npm start
if [ $? -ne 0 ]; then
  echo "Problem encountered starting the OAuth Agent"
  exit 1
fi

