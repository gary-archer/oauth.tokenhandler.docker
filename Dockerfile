#
# The docker image for the Token Handler API
# After building, files in the image can be viewed via the below commands
# - docker run -it tokenhandlerapi:1.0.0 sh
#

# Use the Node docker image for the lightweight Alpine Linux OS
FROM node:16.6.0-alpine

# Install tools for troubleshooting purposes
RUN apk --no-cache add curl
# RUN apk --no-cache add openssl

# Copy files into our docker image and install dependencies
WORKDIR /usr/api
COPY dist                /usr/api/dist
COPY package*.json       /usr/api/
RUN npm install --production

# Run the Express app as the low privilege user
RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser
USER apiuser
CMD ["npm", "run", "startRelease"]
