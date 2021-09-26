# OAuth Token Handler API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

A sample API that enables an SPA to implement OpenID Connect in the optimal API driven manner.

## Modern Web Security

My blog's [Final SPA](https://github.com/gary-archer/oauth.websample.final) uses Curity's [Token Handler Pattern](https://github.com/curityio/web-oauth-via-bff) for modern web security.\
This combines strongest browser security with all of the benefits of an SPA architecture.

## My Token Handler

This API implementation is for my own understanding and to focus on productive developer setups.\
It has some custom code related to expiry testing, custom logging and deployment automation.\
The token handler API can run in either Express or as AWS Serverless Lambdas.

## Instructions

- See the [Token Handler API](https://authguidance.com/2019/04/08/web-reverse-proxy-implementation/) blog post for details on the setup.

## Quick Start

Once development domains and SSL trust are configured, run these commands to spin up the system.\
This is the preferred setup to externalise the plumbing during local web development.

```bash
./build.sh
./deploy.sh
```

## Testing the OAuth Flow via HTTP

To test the API driven commands in the OAuth workflow I use `curl` based tests:

```bash
npm run http
```

## Testing the OAuth Flow via Lambda Functions

The API is deployed to AWS as a low cost Serverless Lambda to serve my [Online SPA](https://authguidance.com/home/code-samples-quickstart/).\
During lambda development I run equivalent tests to ensure that lambda functions work as expected:

```bash
npm run lambda
```
