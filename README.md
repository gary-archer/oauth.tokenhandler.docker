# OAuth Web Proxy API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

A sample API that implements a [Back End for Front End](https://authguidance.com/2019/09/09/spa-back-end-for-front-end) security solution for SPAs.\
The SPA then implements OpenID Connect in a simple manner, with a clean web architecture.

## Running the API

See the [Final SPA](https://github.com/gary-archer/oauth.websample.final) for notes on how to run an end-to-end solution.

## Behaviour

Companies should be able to plug in this type of API rather than biuld it themselves:

- The API is a stateless toolbox microservice that is easy to manage
- The API can be deployed as a low cost Serverless Lambda
- The API can also be run as an Express API on a development computer or in Docker environments

## Back End for Front End

This API does not need to manage any state itself and is deployed as just another microservice.\
The code is a little tricky, but can be implemented once as a toolbox component, then should not need to change.
