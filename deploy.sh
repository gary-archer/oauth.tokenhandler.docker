#!/bin/bash

######################################################################
# Run the Token Handler as Docker containers on a development computer
######################################################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"
LOCALAPI=false

#
# The token handler on a developer PC is configured to forward API requests to a cloud API
# This can be overridden to one of the final APIs running locally if required
#
if [ "$LOCALAPI" == 'true' ]; then
  BUSINESS_API_URL='https://api.mycompany.com:445/api'
else
  BUSINESS_API_URL='https://api.authsamples.com/api'
fi

#
# Do some string manipulation to update kong.yml with the runtime value for the Business API URL
#
ESCAPED_URL=$(echo $BUSINESS_API_URL | sed "s/\//\\\\\//g")
KONG_YML_DATA=$(cat ./delivery/docker-local/kong.template.yml)
KONG_YML_DATA=$(sed "s/BUSINESS_API_URL/$ESCAPED_URL/g" <<< "$KONG_YML_DATA")
echo "$KONG_YML_DATA" > ./delivery/docker-local/kong.yml

#
# Spin up Docker compose components
#
docker compose -f delivery/docker-local/docker-compose.yml down
docker compose -f delivery/docker-local/docker-compose.yml up --force-recreate --remove-orphans
if [ $? -ne 0 ]; then
  echo "Problem encountered starting Docker components"
  exit 1
fi
