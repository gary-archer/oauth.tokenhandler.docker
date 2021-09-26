#!/bin/bash

##########################################
# Get and build the API Gateway components
##########################################

#
# Download SSL certificates
#
rm -rf .certs
git clone https://github.com/gary-archer/oauth.developmentcertificates ./.certs
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading webhost certificates'
    exit 1
fi

#
# Download the Curity reverse proxy plugin
#
git clone https://github.com/curityio/kong-bff-plugin
if [ $? -ne 0 ]; then
    echo 'Problem encountered downloading the Curity token handler plugin'
    exit 1
fi
