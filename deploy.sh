#!/bin/bash

######################################################################
# Run the Token Handler as Docker containers on a development computer
######################################################################

#
# Set the current folder if this script is called from another script
#
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
# Spin up Docker compose components
#
docker compose -f delivery/localhost/docker-compose.yml down
docker compose -f delivery/localhost/docker-compose.yml up --force-recreate --remove-orphans
if [ $? -ne 0 ]; then
  echo "Problem encountered starting Docker components"
  exit 1
fi
