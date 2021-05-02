#!/bin/bash

# Simulate login completion when the API swaps the authorization code for tokens and issues an auth cookie
npm run authorizationCodeGrant 

# Simulate the browser UI getting an access token from the API
#npm run refreshTokenGrant

# Simulate expiry of the refresh token in the auth cookie
#npm run expireRefreshToken

# Expire the auth cookie when a user's session ends
#npm run expireSession