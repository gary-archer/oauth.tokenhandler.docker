#
# The docker image for the Web Proxy API
# After building, files in the image can be viewed via the below commands
# - docker run -it webproxyapi:1.0.0 sh
#

# Use the Node docker image for the lightweight Alpine Linux OS
FROM node:16.6.0-alpine

# Install tools for troubleshooting purposes
RUN apk --no-cache add curl
# RUN apk --no-cache add openssl

# Copy files into our docker image and install dependencies
WORKDIR /usr/api
COPY oauth.webproxyapi/dist                /usr/api/dist
COPY oauth.webproxyapi/package*.json       /usr/api/
RUN npm install --production

# Configure the Linux OS to trust the root certificate, to enable HTTPS calls inside the cluster
COPY certs/docker-internal/mycompany.internal.ca.pem /usr/local/share/ca-certificates/trusted.ca.pem
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/trusted.ca.pem

# Run the Express app as the low privilege user
RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser
USER apiuser
CMD ["npm", "run", "startRelease"]
