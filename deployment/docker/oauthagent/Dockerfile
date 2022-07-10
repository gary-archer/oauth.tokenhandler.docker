FROM node:16.15.0-alpine

# Run a script from a runtime argument to do initialization of trusted certificates when required
ARG TRUSTED_CA_CERTS
COPY $TRUSTED_CA_CERTS /usr/local/share/certificates/trusted.ca.crt
COPY deployment/docker/oauthagent/docker-init.sh /tmp/
RUN chmod +x /tmp/docker-init.sh && /tmp/docker-init.sh

# Copy files into our docker image and install dependencies
WORKDIR /usr/api
COPY dist                /usr/api/dist
COPY package*.json       /usr/api/
RUN npm install --production

# Run the Express app as a low privilege user
RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser
USER apiuser
CMD ["npm", "run", "startRelease"]
