#
# The docker image for the OAuth Agent
# After building, files in the image can be viewed via the below command:
# - docker run -it oauthagent:v1 sh
#

# Use the Node docker image for the lightweight Alpine Linux OS
FROM node:16.6.0-alpine

# Set the API folder
WORKDIR /usr/api

# Copy files into our docker image and install dependencies
COPY dist                /usr/api/dist
COPY package*.json       /usr/api/
RUN npm install --production

# Create a low privilege user
RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser

# Configure trusted root authorities when making HTTPS calls inside the cluster
COPY trusted.ca.pem /usr/local/share/ca-certificates/trusted.ca.pem
RUN apk --no-cache add ca-certificates
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/trusted.ca.pem

# Run the Express app as the low privilege user
USER apiuser
CMD ["npm", "run", "startRelease"]
