#!/bin/bash

##################################################
# Free Docker resources when finished with the API
##################################################

docker compose -f delivery/docker-localweb/docker-compose.yml down
