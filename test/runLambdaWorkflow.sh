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
# A simple routine to get a header value from an HTTP response file in a direct Cognito request
# The sed expression matches everything after the colon, after which we return this in group 1
#
function getCognitoHeaderValue(){
  local _HEADER_NAME=$1
  local _HEADER_VALUE=$(cat $RESPONSE_FILE | grep -i "^$_HEADER_NAME" | sed -r "s/^$_HEADER_NAME: (.*)$/\1/i")
  local _HEADER_VALUE=${_HEADER_VALUE%$'\r'}
  echo $_HEADER_VALUE
}

#
# Similar to the above except that we read a cookie value from an HTTP response file in a direct Cognito request
# This currently only supports a single cookie in each set-cookie header, which is good enough for my purposes
#
function getCognitoCookieValue(){
  local _COOKIE_NAME=$1
  local _COOKIE_VALUE=$(cat $RESPONSE_FILE | grep -i "set-cookie: $_COOKIE_NAME" | sed -r "s/^set-cookie: $_COOKIE_NAME=(.[^;]*)(.*)$/\1/i")
  local _COOKIE_VALUE=${_COOKIE_VALUE%$'\r'}
  echo $_COOKIE_VALUE
}

#
# Read until we get to the parameter and then return everything up to the next query parameter
# We then return the value of the query parameter by returning the match in group 2
#
function getQueryParameterValue(){
  local _URL=$1
  local _PARAM_NAME=$2
  local _PARAM_VALUE=$(echo $_URL | sed -r "s/^(.*)$_PARAM_NAME=(.[^&]*)(.*)$/\2/")
  echo $_PARAM_VALUE
}

#
# Get a cookie name passed in the first argument from the multi value headers passed in the second
#
function getLambdaResponseCookieValue(){
  
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
headers=$(jo origin="$WEB_BASE_URL" \
accept=application/json) \
> $REQUEST_FILE

#
# Call the startLogin lambda and redirect the output
#
echo "*** Creating login URL ..."
$SLS invoke local -f startLogin -p $REQUEST_FILE > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the startLogin lambda"
  exit
fi

#
# Read the response data and handle failures
#
JSON=$(cat $RESPONSE_FILE)
HTTP_STATUS=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
MULTI_VALUE_HEADERS=$(jq -r .multiValueHeaders <<< "$JSON")
if [ $HTTP_STATUS -ne 200 ]; then
  echo "*** Problem encountered starting a login, status: $HTTP_STATUS"
  apiError "$BODY"
  exit
fi

#
# Get values we will use later
#
AUTHORIZATION_REQUEST_URL=$(jq -r .authorizationRequestUri <<< "$BODY")
STATE_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-state-$APP_NAME" "$MULTI_VALUE_HEADERS")

#
# Next invoke the redirect URI to start a login
#
echo "*** Following login redirect ..."
HTTP_STATUS=$(curl -i -L -s "$AUTHORIZATION_REQUEST_URL" -o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered using the OpenID Connect authorization URL, status: $HTTP_STATUS"
  exit
fi

#
# Get data we will use in order to post test credentials and automate a login
# The Cognito CSRF cookie is written twice due to following the redirect, so get the second occurrence
#
LOGIN_POST_LOCATION=$(getCognitoHeaderValue 'location')
COGNITO_XSRF_TOKEN=$(getCognitoCookieValue 'XSRF-TOKEN' | cut -d ' ' -f 2)

#
# We can now post a password credential, and the form fields used are Cognito specific
#
echo "*** Posting credentials to sign in the test user ..."
HTTP_STATUS=$(curl -i -s -X POST "$LOGIN_POST_LOCATION" \
-H "origin: $LOGIN_BASE_URL" \
--cookie "XSRF-TOKEN=$COGNITO_XSRF_TOKEN" \
--data-urlencode "_csrf=$COGNITO_XSRF_TOKEN" \
--data-urlencode "username=$TEST_USERNAME" \
--data-urlencode "password=$TEST_PASSWORD" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '302' ]; then
  echo "*** Problem encountered posting a credential to AWS Cognito, status: $HTTP_STATUS"
  exit
fi

#
# Next get the code and state from the redirect response's query parameters, but without following the redirect
#
AUTHORIZATION_RESPONSE_URL=$(getCognitoHeaderValue 'location')
AUTH_STATE=$(getQueryParameterValue $AUTHORIZATION_RESPONSE_URL 'state')
AUTH_CODE=$(getQueryParameterValue $AUTHORIZATION_RESPONSE_URL 'code')

#
# Next write the input file for the end login request
# Note that it is tricky to output the body parameters in the stringified form lambda expects
#
jo \
path=/spa/login/end \
httpMethod=POST \
headers=$(jo origin="$WEB_BASE_URL" \
accept=application/json \
content-type=application/json) \
multiValueHeaders=$(jo cookie=$(jo -a "$COOKIE_PREFIX-state-$APP_NAME=$STATE_COOKIE")) \
body="{\\\""code\\\"":\\\""$AUTH_CODE\\\"", \\\""state\\\"":\\\""$AUTH_STATE\\\""}" \
| sed 's/\\\\\\/\\/g' \
| jq > $REQUEST_FILE

#
# Call the endLogin lambda and redirect the output
#
echo "*** Finishing the login by processing the authorization code ..."
$SLS invoke local -f endLogin -p $REQUEST_FILE > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the endLogin lambda"
  exit
fi

#
# Read the response data and handle failures
#
JSON=$(cat $RESPONSE_FILE)
HTTP_STATUS=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
MULTI_VALUE_HEADERS=$(jq -r .multiValueHeaders <<< "$JSON")
if [ $HTTP_STATUS -ne 200 ]; then
  echo "*** Problem encountered ending a login, status: $HTTP_STATUS"
  apiError "$BODY"
  exit
fi