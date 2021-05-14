#!/bin/bash

#
# A script to run Serverless lambdas locally and to deal with inputs and outputs
#
SLS=./node_modules/.bin/sls

# Write the request.txt with jq and call 'sls invoke local -f startLogin -p test/request.json'
$SLS invoke local -f startLogin -p test/data/startLoginRequest.json

# Send the code, state and state cookie, then write cookies and anti forgery details
#npm run endLogin 

# Get an access token using the refresh token in the auth cookie
#npm run refreshToken

# Make the refresh token in the auth cookie act expired
#npm run expireSession

# Get the logout redirect URL and remove cookies
#npm run startLogout
