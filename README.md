# OAuth Back End for Front End API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

A sample API that implements a [Back End for Front End](https://authguidance.com/2019/09/09/spa-back-end-for-front-end) security solution for SPAs.\
An API driven approach is used, for best SPA control and zero cookie problems.

## Running the API

See the [Final SPA](https://github.com/gary-archer/oauth.websample.final) for notes on how to run an end-to-end solution.

## API Driven Benefits

The SPA retains all of the benefits of an SPA architecture:

- Best browser security
- Full control over usability
- Simple code
- Deploy anywhere

## API Behaviour

- The API is a stateless toolbox microservice that is easy to manage
- The API can be deployed as a low cost Serverless Lambda
- The API can also be run as an Express API on a development computer or deployed via Docker

## Open Source Implementations

Companies are advised to plug in a Back End for Front End API developed by security experts:

- [Curity SPA Example](https://github.com/curityio/web-oauth-via-bff)
- [Curity BFF API Example](https://github.com/curityio/bff-node-express)

## My Customizations

My BFF API includes customizations of logging, expiry testing and developer automation.\
The main downside of a Back End for Front End approach is a more complex developer setup.