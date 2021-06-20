# OAuth Web Proxy API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

An API that issues same site cookies for the [Final SPA](https://github.com/gary-archer/oauth.websample.final) as part of a [Back End for Front End](https://authguidance.com/2019/09/09/spa-back-end-for-front-end) solution.

### Deployment

- The API is deployed to AWS London as a low cost Serverless Lambda
- The API can also be run as an Express API, for local development or if Kubernetes deployment is preferred
- The SPA is deployed to 20 global locations via AWS Cloudfront, at very low cost

### Back End for Front End

This 'Proxy API' does not need to manage any state itself and is deployed as just another microservice.\
The code is a little tricky, but can be implemented once as a toolbox component, then should not need to change.

### Developer Setup

Developers can run the Express version of the Proxy API for testing, with the SPA as a client:

- git clone https://github.com/gary-archer/oauth.webproxyapi
- cd oauth.webproxyapi
- npm install && npm start

### Automation Scripts

Authorization Code Flow API operations are difficult to test since they rely on real user logins.\
To enable a productive setup, these bash scripts provide some login automation:

- [runHttpWorkflow.sh](./test/runHttpWorkflow.sh)
- [runLambdaWorkflow.sh](./test/runLambdaWorkflow.sh)

To check that all HTTP endpoints are working, this script runs all OAuth lifecycle events for a user session.\
This results in multiple OAuth requests including login redirects and dealing with inputs and outputs:

- npm run http

To test that all lambda operations are working on a Developer PC, the below commands can be run.\
This does the equivalent thing, using `sls invoke` commands and dealing with inputs and outputs:

- npm run build
- npm run lambda
