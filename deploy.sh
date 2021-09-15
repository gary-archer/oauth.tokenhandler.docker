#!/bin/bash

##############################################################
# Run the Back End for Front End API on a development computer
##############################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
npm start
if [ $? -ne 0 ]; then
    echo 'Problem encountered running the Back End for Front End API'
    exit 1
fi