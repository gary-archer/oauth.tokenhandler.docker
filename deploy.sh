#!/bin/bash

##############################################################
# Run the Back End for Front End API on a development computer
##############################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Get the platform
#
case "$(uname -s)" in

  Darwin)
    PLATFORM="MACOS"
 	;;

  MINGW64*)
    PLATFORM="WINDOWS"
	;;
esac

#
# Run the API gateway in a separate terminal window
#
if [ "$PLATFORM" == 'MACOS' ]; then
    open -a Terminal ./api-gateway/deploy.sh
    
else
    GIT_BASH="C:\Program Files\Git\git-bash.exe"
    "$GIT_BASH" -c ./api-gateway/deploy.sh &
fi

#
# Then run the back end for front end API
#
npm start
if [ $? -ne 0 ]; then
    echo 'Problem encountered running the Back End for Front End API'
    exit 1
fi
