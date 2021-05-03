#!/bin/bash

# Get the authorization redirect URL and write a state cookie
npm run startLogin

# Send the code, state and state cookie, then write cookies and anti forgery details
npm run endLogin 

# Get an access token using the refresh token in the auth cookie
npm run refreshToken

# Make the refresh token in the auth cookie act expired
npm run expireSession

# Get the logout redirect URL and remove cookies
npm run startLogout
