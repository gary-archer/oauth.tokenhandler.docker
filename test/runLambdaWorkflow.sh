#!/bin/bash

#
# A script to run Serverless lambdas locally and to deal with inputs and outputs
# Requires the jo and jq tools to be installed
#

#
# Endpoints and parameters
#
export HTTPS_PROXY='http://127.0.0.1:8888'
WEB_BASE_URL='https://web22.mycompany.com'
PROXY_API_BASE_URL='https://api.mycompany.com:444'
BUSINESS_API_BASE_URL='https://api.authsamples.com'
LOGIN_BASE_URL='https://login.authsamples.com'
COOKIE_PREFIX=mycompany
APP_NAME=finalspa
TEST_USERNAME='guestuser@mycompany.com'
TEST_PASSWORD=GuestPassword1
REQUEST_FILE=test/request.txt
RESPONSE_FILE=test/response.txt
SLS=./node_modules/.bin/sls

#
# Use these overrides to test AWS deployed endpoints
#
#WEB_BASE_URL=https://web.authsamples.com
#PROXY_API_BASE_URL=https://api.authsamples.com

#
# Write the input file for the start login request
#
jo -p \
path=/spa/login/start \
httpMethod=POST \
headers=$(jo origin="$WEB_BASE_URL" accept=application/json) \
> test/request.txt

#
# Call startLogin to write the response data
#
$SLS invoke local -f startLogin -p test/request.txt > test/response.txt
if [ $? -ne 0 ]; then
  echo "Problem encountered starting a login, status: $HTTP_STATUS"
  exit
fi