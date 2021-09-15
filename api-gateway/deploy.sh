#!/bin/bash

################################
# Run the API Gateway via Docker
################################

#
# Clean up from last time if required
#
cd "$(dirname "${BASH_SOURCE[0]}")"
docker compose down

#
# Spin up Docker compose components
#
docker compose up --force-recreate --remove-orphans
if [ $? -ne 0 ]; then
  echo "Problem encountered starting Docker components"
  exit 1
fi
