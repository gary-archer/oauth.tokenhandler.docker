#!/bin/bash

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
  echo "Problem encountered installing the BFF API dependencies"
  exit 1
fi
