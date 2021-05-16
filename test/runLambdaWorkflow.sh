#!/bin/bash

#
# A script to run Serverless lambdas locally and to deal with inputs and outputs
# This uses the jo tool to write JSON objects and the jq tool to read JSON objects
#

#
# Endpoints and parameters
#
export HTTPS_PROXY='http://127.0.0.1:8888'
WEB_BASE_URL='https://web.mycompany.com'
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
# Get a cookie name passed in the first argument from the multi value headers passed in the second
#
function getCookieValue(){
  
  local _COOKIE_TEXT=$(jq -r --arg NAME "$1" '."set-cookie"[] | select(. | contains($NAME))' <<< "$2")
  local _COOKIE_VALUE=$(echo $_COOKIE_TEXT | sed -r "s/^$1=(.[^;]*)(.*)$/\1/")
  echo $_COOKIE_VALUE
}

#
# Render an error result returned from the API
#
function apiError() {

  local _CODE=$(jq -r .code <<< "$1")
  local _MESSAGE=$(jq -r .message <<< "$1")

  if [ "$_CODE" != 'null'  ] && [ "$_MESSAGE" != 'null' ]; then
    echo "*** Code: $_CODE, Message: $_MESSAGE"
  fi
}


#
# Write the input file for the startLogin request
#
jo -p \
path=/spa/login/start \
httpMethod=POST \
headers=$(jo origin="$WEB_BASE_URL" accept=application/json) \
> $REQUEST_FILE

#
# Call the startLogin lambda and redirect the output
#
echo "*** Creating login URL ..."
$SLS invoke local -f startLogin -p test/request.txt > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the startLogin lambda"
  exit
fi

#
# Read the response data and handle failures
#
JSON=$(cat $RESPONSE_FILE)
STATUS_CODE=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
MULTI_VALUE_HEADERS=$(jq -r .multiValueHeaders <<< "$JSON")
if [ $STATUS_CODE -ne 200 ]; then
  echo "*** Problem encountered starting a login, status: $STATUS_CODE"
  apiError "$BODY"
  exit
fi

#
# Get values we will use later
#
AUTHORIZATION_REQUEST_URL=$(jq -r .authorizationRequestUri <<< "$BODY")
STATE_COOKIE=$(getCookieValue "$COOKIE_PREFIX-state-$APP_NAME" "$MULTI_VALUE_HEADERS")

#
#
#