#!/bin/bash

#
# A script to run Serverless lambdas locally and to deal with inputs and outputs
# This uses the jo tool to write JSON objects and the jq tool to read JSON objects
#

WEB_BASE_URL='https://web.mycompany.com'
BUSINESS_API_BASE_URL='https://api.authsamples.com'
LOGIN_BASE_URL='https://login.authsamples.com'
COOKIE_PREFIX=mycompany
APP_NAME=finalspa
TEST_USERNAME='guestuser@mycompany.com'
TEST_PASSWORD=GuestPassword1
SESSION_ID=$(uuidgen)
REQUEST_FILE=test/request.txt
RESPONSE_FILE=test/response.txt
SLS=./node_modules/.bin/sls

#
# Enable this to view requests in an HTTP Proxy tool
#
#export HTTPS_PROXY='http://127.0.0.1:8888'

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
# A subroutine in order to avoid duplication
#
function createPostWithCookiesRequest() {

  jo -p \
    path=$1 \
    httpMethod=POST \
    headers=$(jo origin="$WEB_BASE_URL" \
    accept=application/json \
    content-type=application/json \
    x-mycompany-api-client=lambdaTest \
    x-mycompany-session-id=$SESSION_ID \
    "x-$COOKIE_PREFIX-aft-$APP_NAME=$ANTI_FORGERY_TOKEN") \
    multiValueHeaders=$(jo cookie=$(jo -a \
    "$COOKIE_PREFIX-auth-$APP_NAME=$AUTH_COOKIE", \
    "$COOKIE_PREFIX-id-$APP_NAME=$ID_COOKIE", \
    "$COOKIE_PREFIX-aft-$APP_NAME=$AFT_COOKIE")) > $REQUEST_FILE
}

#
# First remove logs from last time
#
echo "*** Session ID is $SESSION_ID"
rm logs/api.log 2>/dev/null
mkdir -p logs

#
# Write the input file for the startLogin request
#
jo -p \
path=/bff/login/start \
httpMethod=POST \
headers=$(jo origin="$WEB_BASE_URL" \
accept=application/json \
x-mycompany-api-client=lambdaTest \
x-mycompany-session-id=$SESSION_ID) \
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
# Next get the response
#
AUTHORIZATION_RESPONSE_URL=$(getCognitoHeaderValue 'location')

#
# Next write the input file for the end login request
# Note that it is tricky to output the body parameters in the stringified form lambda expects
#
jo \
path=/bff/login/end \
httpMethod=POST \
headers=$(jo origin="$WEB_BASE_URL" \
accept=application/json \
content-type=application/json \
x-mycompany-api-client=lambdaTest \
x-mycompany-session-id=$SESSION_ID) \
multiValueHeaders=$(jo cookie=$(jo -a "$COOKIE_PREFIX-state-$APP_NAME=$STATE_COOKIE")) \
body="{\\\""url\\\"":\\\""$AUTHORIZATION_RESPONSE_URL\\\""}" \
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

#
# Get values we will use shortly
#
AUTH_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-auth-$APP_NAME" "$MULTI_VALUE_HEADERS")
ID_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-id-$APP_NAME" "$MULTI_VALUE_HEADERS")
AFT_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-aft-$APP_NAME" "$MULTI_VALUE_HEADERS")
ANTI_FORGERY_TOKEN=$(jq -r .antiForgeryToken <<< "$BODY")

#
# Invoke the refresh lambda to get an access token
#
echo "*** Calling refresh to get an access token in the client ..."
createPostWithCookiesRequest '/bff/token'
$SLS invoke local -f refreshToken -p $REQUEST_FILE > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the refreshToken lambda"
  exit
fi

#
# Get data that we will use later
#
JSON=$(cat $RESPONSE_FILE)
HTTP_STATUS=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
MULTI_VALUE_HEADERS=$(jq -r .multiValueHeaders <<< "$JSON")
if [ $HTTP_STATUS -ne 200 ]; then
  echo "*** Problem encountered refreshing an access token, status: $HTTP_STATUS"
  apiError "$BODY"
  exit
fi

#
# Reget these values after every refresh
#
AUTH_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-auth-$APP_NAME" "$MULTI_VALUE_HEADERS")
ID_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-id-$APP_NAME" "$MULTI_VALUE_HEADERS")
ACCESS_TOKEN=$(jq -r .accessToken <<< "$BODY")

#
# Call the business API with an access token
#
echo "*** Calling cross domain API with an access token ..."
HTTP_STATUS=$(curl -s "$BUSINESS_API_BASE_URL/api/companies" \
-H "Authorization: Bearer $ACCESS_TOKEN" \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered calling the API with an access token, status: $HTTP_STATUS"
  apiError "$(cat $RESPONSE_FILE)"
  exit
fi

#
# Next expire the session by rewriting the refresh token in the auth cookie, for test purposes
#
echo "*** Expiring the refresh token to force an end of session ..."
createPostWithCookiesRequest '/bff/token/expire'
$SLS invoke local -f expireSession -p $REQUEST_FILE > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the expireSession lambda"
  exit
fi

#
# Check for the expected result
#
JSON=$(cat $RESPONSE_FILE)
HTTP_STATUS=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
MULTI_VALUE_HEADERS=$(jq -r .multiValueHeaders <<< "$JSON")
if [ $HTTP_STATUS != '204' ]; then
  echo "*** Problem encountered expiring the refresh token, status: $HTTP_STATUS"
  apiError "$BODY"
  exit
fi

#
# Get the updated auth cookie, which now contains an invalid refresh token
#
AUTH_COOKIE=$(getLambdaResponseCookieValue "$COOKIE_PREFIX-auth-$APP_NAME" "$MULTI_VALUE_HEADERS")

#
# Next try to refresh the token again and we should get an invalid_grant error
#
echo "*** Calling refresh to get an access token when the session is expired ..."
createPostWithCookiesRequest '/bff/token'
$SLS invoke local -f refreshToken -p $REQUEST_FILE > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the refreshToken lambda"
  exit
fi

#
# Check for the expected error
#
JSON=$(cat $RESPONSE_FILE)
HTTP_STATUS=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
if [ $HTTP_STATUS != '400' ]; then
  echo "*** The expected 400 error did not occur, status: $HTTP_STATUS"
  apiError $BODY
  exit
fi

#
# Next start a logout request
#
echo "*** Calling start logout to clear cookies and get the end session request URL ..."
createPostWithCookiesRequest '/logout'
$SLS invoke local -f startLogout -p $REQUEST_FILE > $RESPONSE_FILE
if [ $? -ne 0 ]; then
  echo "*** Problem encountered invoking the startLogout lambda"
  exit
fi

#
# Check for the expected result
#
JSON=$(cat $RESPONSE_FILE)
HTTP_STATUS=$(jq -r .statusCode <<< "$JSON")
BODY=$(jq -r .body <<< "$JSON")
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered starting a logout, status: $HTTP_STATUS"
  apiError "$BODY"
  exit
fi

#
# The real SPA will then do a logout redirect with this URL
#
END_SESSION_REQUEST_URL=$(jq -r .endSessionRequestUri <<< "$BODY")
