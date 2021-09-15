#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

##########################################################
# Run the Back End for Front End API on the local computer
##########################################################

npm start
if [ $? -ne 0 ]; then
    echo 'Problem encountered running the Back End for Front End API'
    exit 1
fi