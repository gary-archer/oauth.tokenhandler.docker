#!/bin/bash

#
# A script to test HTTP messages that the SPA and browser will together send to the OAuth Web Proxy API
# Requires the jq tool to be installed
#

#
# Endpoints and parameters
#
#export HTTPS_PROXY='http://127.0.0.1:8888'
WEB_BASE_URL='https://web.mycompany.com'
PROXY_API_BASE_URL='https://api.mycompany.com:444/proxy/spa'
BUSINESS_API_BASE_URL='https://api.authsamples.com'
LOGIN_BASE_URL='https://login.authsamples.com'
COOKIE_PREFIX=mycompany
APP_NAME=finalspa
TEST_USERNAME='guestuser@mycompany.com'
TEST_PASSWORD=GuestPassword1
SESSION_ID=$(uuidgen)
RESPONSE_FILE=test/response.txt

#
# Use these overrides to test AWS deployed endpoints
#
#WEB_BASE_URL=https://web.authsamples.com
#PROXY_API_BASE_URL=https://api.authsamples.com/proxy/spa

#
# A simple routine to get a header value from an HTTP response file
# The sed expression matches everything after the colon, after which we return this in group 1
#
function getHeaderValue(){
  local _HEADER_NAME=$1
  local _HEADER_VALUE=$(cat $RESPONSE_FILE | grep -i "^$_HEADER_NAME" | sed -r "s/^$_HEADER_NAME: (.*)$/\1/i")
  local _HEADER_VALUE=${_HEADER_VALUE%$'\r'}
  echo $_HEADER_VALUE
}

#
# Similar to the above except that we read a cookie value from an HTTP response file
# This currently only supports a single cookie in each set-cookie header, which is good enough for my purposes
#
function getCookieValue(){
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
# Render an error result returned from the API
#
function apiError() {

  local _JSON=$(tail -n 1 $RESPONSE_FILE)
  local _CODE=$(jq -r .code <<< "$_JSON")
  local _MESSAGE=$(jq -r .message <<< "$_JSON")
  
  if [ "$_CODE" != 'null'  ] && [ "$_MESSAGE" != 'null' ]; then
    echo "*** Code: $_CODE, Message: $_MESSAGE"
  fi
}

#
# Act as the SPA by sending an OPTIONS request, then verifying that we get the expected results
#
echo "*** Requesting cross origin access"
HTTP_STATUS=$(curl -i -s -X OPTIONS "$PROXY_API_BASE_URL/login/start" \
-H "origin: $WEB_BASE_URL" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200'  ] && [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Problem encountered requesting cross origin access, status: $HTTP_STATUS"
  exit
fi

#
# Act as the SPA by calling the OAuth proxy API to start a login and get the request URI
#
echo "*** Creating login URL ..."
HTTP_STATUS=$(curl -i -s -X POST "$PROXY_API_BASE_URL/login/start" \
-H "origin: $WEB_BASE_URL" \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered starting a login, status: $HTTP_STATUS"
  exit
fi

#
# Get data we will use later
#
JSON=$(tail -n 1 $RESPONSE_FILE)
AUTHORIZATION_REQUEST_URL=$(jq -r .authorizationRequestUri <<< "$JSON")
STATE_COOKIE=$(getCookieValue "$COOKIE_PREFIX-state-$APP_NAME")

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
LOGIN_POST_LOCATION=$(getHeaderValue 'location')
COGNITO_XSRF_TOKEN=$(getCookieValue 'XSRF-TOKEN' | cut -d ' ' -f 2)

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
AUTHORIZATION_RESPONSE_URL=$(getHeaderValue 'location')
AUTH_STATE=$(getQueryParameterValue $AUTHORIZATION_RESPONSE_URL 'state')
AUTH_CODE=$(getQueryParameterValue $AUTHORIZATION_RESPONSE_URL 'code')

#
# Next we end the login by asking the server to do an authorization code grant
#
echo "*** Finishing the login by processing the authorization code ..."
HTTP_STATUS=$(curl -i -s -X POST "$PROXY_API_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
--cookie "$COOKIE_PREFIX-state-$APP_NAME=$STATE_COOKIE" \
-d '{"code":"'$AUTH_CODE'", "state":"'$AUTH_STATE'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered ending a login, status: $HTTP_STATUS"
  apiError
  exit
fi

#
# Get data that we will use later
#
JSON=$(tail -n 1 $RESPONSE_FILE)
ANTI_FORGERY_TOKEN=$(jq -r .antiForgeryToken <<< "$JSON")
AUTH_COOKIE=$(getCookieValue "$COOKIE_PREFIX-auth-$APP_NAME")
ID_COOKIE=$(getCookieValue "$COOKIE_PREFIX-id-$APP_NAME")
AFT_COOKIE=$(getCookieValue "$COOKIE_PREFIX-aft-$APP_NAME")

#
# Next get an access token so that the client can make cross domain calls
#
echo "*** Calling refresh to get an access token in the client ..."
HTTP_STATUS=$(curl -i -s -X POST "$PROXY_API_BASE_URL/token" \
-H "origin: $WEB_BASE_URL" \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
-H "x-$COOKIE_PREFIX-aft-$APP_NAME: $ANTI_FORGERY_TOKEN" \
--cookie "$COOKIE_PREFIX-auth-$APP_NAME=$AUTH_COOKIE;$COOKIE_PREFIX-id-$APP_NAME=$ID_COOKIE;$COOKIE_PREFIX-aft-$APP_NAME=$AFT_COOKIE" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered getting an access token, status: $HTTP_STATUS"
  apiError
  exit
fi

#
# Get data that we will use later
#
JSON=$(tail -n 1 $RESPONSE_FILE)
ACCESS_TOKEN=$(jq -r .accessToken <<< "$JSON")
ANTI_FORGERY_TOKEN=$(jq -r .antiForgeryToken <<< "$JSON")
AUTH_COOKIE=$(getCookieValue "$COOKIE_PREFIX-auth-$APP_NAME")
ID_COOKIE=$(getCookieValue "$COOKIE_PREFIX-id-$APP_NAME")
AFT_COOKIE=$(getCookieValue "$COOKIE_PREFIX-aft-$APP_NAME")

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
  apiError
  exit
fi

#
# Next expire the refresh token in the auth cookie, for test purposes
#
echo "*** Expiring the refresh token ..."
HTTP_STATUS=$(curl -i -s -X POST "$PROXY_API_BASE_URL/token/expire" \
-H "origin: $WEB_BASE_URL" \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
-H "x-$COOKIE_PREFIX-aft-$APP_NAME: $ANTI_FORGERY_TOKEN" \
--cookie "$COOKIE_PREFIX-auth-$APP_NAME=$AUTH_COOKIE;$COOKIE_PREFIX-id-$APP_NAME=$ID_COOKIE;$COOKIE_PREFIX-aft-$APP_NAME=$AFT_COOKIE" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '204' ]; then
  echo "*** Problem encountered expiring the refresh token, status: $HTTP_STATUS"
  apiError
  exit
fi

#
# Get the updated auth cookie, which now contains an invalid refresh token
#
AUTH_COOKIE=$(getCookieValue "$COOKIE_PREFIX-auth-$APP_NAME")

#
# Next try to refresh the token again and we should get an invalid_grant error
#
echo "*** Calling refresh to get an access token when the session is expired ..."
HTTP_STATUS=$(curl -i -s -X POST "$PROXY_API_BASE_URL/token" \
-H "origin: $WEB_BASE_URL" \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
-H "x-$COOKIE_PREFIX-aft-$APP_NAME: $ANTI_FORGERY_TOKEN" \
--cookie "$COOKIE_PREFIX-auth-$APP_NAME=$AUTH_COOKIE;$COOKIE_PREFIX-id-$APP_NAME=$ID_COOKIE;$COOKIE_PREFIX-aft-$APP_NAME=$AFT_COOKIE" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '400' ]; then
  echo "*** The expected 400 error did not occur, status: $HTTP_STATUS"
  apiError
  exit
fi

#
# Next make a start logout request
#
echo "*** Calling start logout to clear cookies and get the end session request URL ..."
HTTP_STATUS=$(curl -i -s -X POST "$PROXY_API_BASE_URL/logout/start" \
-H "origin: $WEB_BASE_URL" \
-H 'accept: application/json' \
-H 'x-mycompany-api-client: httpTest' \
-H "x-mycompany-session-id: $SESSION_ID" \
-H "x-$COOKIE_PREFIX-aft-$APP_NAME: $ANTI_FORGERY_TOKEN" \
--cookie "$COOKIE_PREFIX-auth-$APP_NAME=$AUTH_COOKIE;$COOKIE_PREFIX-id-$APP_NAME=$ID_COOKIE;$COOKIE_PREFIX-aft-$APP_NAME=$AFT_COOKIE" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered starting a logout, status: $HTTP_STATUS"
  apiError
  exit
fi

#
# The real SPA will then do a logout redirect with this URL
#
JSON=$(tail -n 1 $RESPONSE_FILE)
END_SESSION_REQUEST_URL=$(jq -r .endSessionRequestUri <<< "$JSON")
