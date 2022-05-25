FROM node:16.6.0-alpine

# One or more root CAs are trusted at build time
ARG TRUSTED_CA_CERTS
COPY $TRUSTED_CA_CERTS /usr/local/share/certificates/trusted.ca.crt
RUN apk --no-cache add ca-certificates && update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/trusted.ca.crt

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
