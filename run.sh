#!/bin/bash

#################################################
# Run the Token Handler in the Express web server
#################################################

#
# Set the current folder if this script is called from another script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Start the Express API
#
npm start
if [ $? -ne 0 ]; then
  echo "Problem encountered starting the Token Handler API"
  exit 1
fi
