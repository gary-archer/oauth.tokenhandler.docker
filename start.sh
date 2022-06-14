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
# Download certificates if required
#
./downloadcerts.sh
if [ $? -ne 0 ]; then
  exit
fi

#
# Install API dependencies
#
if [ ! -d 'node_modules' ]; then
  
  rm -rf node_modules
  npm install
  if [ $? -ne 0 ]; then
    echo 'Problem encountered installing the OAuth Agent dependencies'
    exit
  fi
fi

#
# Run code quality checks
#
npm run lint
if [ $? -ne 0 ]; then
  echo 'Code quality checks failed'
  exit
fi

#
# Start the Express API in watch mode
# On Linux first ensure that you have first granted Node.js permissions to listen on port 444:
# - sudo setcap 'cap_net_bind_service=+ep' $(which node)
#
RUN_COMMAND="./node_modules/.bin/ts-node --files 'src/app.ts'"
./node_modules/.bin/nodemon --watch 'src/**/*' -e ts --exec "$RUN_COMMAND"
if [ $? -ne 0 ]; then
  echo 'Problem encountered running the OAuth Agent'
  exit
fi
