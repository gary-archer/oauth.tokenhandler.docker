#!/bin/bash

##############################################################
# Run the Back End for Front End API on a development computer
##############################################################

#
# First run the back end for front end API
#
cd "$(dirname "${BASH_SOURCE[0]}")"
npm start
if [ $? -ne 0 ]; then
    echo 'Problem encountered running the Back End for Front End API'
    exit 1
fi

#
# Next run the API gateway, which will extract an access token from secure cookies and forward it to business APIs
#