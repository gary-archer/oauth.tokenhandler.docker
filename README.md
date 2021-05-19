# OAuth Web Proxy API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

An API that issues same site cookies for the [Final SPA](https://github.com/gary-archer/oauth.websample.final) as part of a `Back End for Front End` solution.

### Deployment

- The API is deployed to AWS London as a low cost Serverless Lambda
- The API can also be run as an Express API, for local development or if Kubernetes deployment is preferred
- The SPA is deployed to 20 global locations via AWS Cloudfront, at very low cost

### Back End for Front End

This 'Proxy API' does not need to manage any state itself and is deployed as just another microservice.\
The code is a little tricky, but can be implemented once as a toolbox component, then should not need to change.

### Developer Setup

Developers need to run the Express version of the Proxy API:

- git clone https://github.com/gary-archer/oauth.webproxyapi
- cd oauth.webproxyapi
- npm install && npm start

### Back End for Front End Testing

OAuth operations from the Authorization Code Flow are difficult to test since they rely on real user logins.\
To enable a productive setup, these bash scripts do some login automation, though the code is a little hacky:

- [runHttpWorkflow.sh](./test/runHttpWorkflow.sh)
- [runLambdaWorkflow.sh](./test/runLambdaWorkflow.sh)

### Testing the HTTP Workflow

To understand HTTP Message details it can be useful to run the SPA's workflow for an entire user session.\
Then use an HTTP Proxy Tool to view the [Final SPA Messages](https://authguidance.com/2020/05/24/spa-and-api-final-http-messages/):

- npm run http

### Testing the Lambda Workflow

Testing the lambda operations for an SPA user session on a Developer PC can be done in a similar manner.\
This causes a number of `sls invoke` calls to be triggered, each with valid input data:

- npm run build
- npm run lambda
