#!/bin/bash

########################################################
# A convenience script to start / deploy the OAuth Agent
########################################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Start the Express API
#
npm start
if [ $? -ne 0 ]; then
  echo "Problem encountered starting the OAuth Agent"
  exit 1
fi

