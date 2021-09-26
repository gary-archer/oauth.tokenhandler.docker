# OAuth Token Handler API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

A sample API that enables an SPA to implement OpenID Connect in the optimal API driven manner.

## Modern Web Security

My blog's [Final SPA](https://github.com/gary-archer/oauth.websample.final) uses the Curity `Token Handler Pattern` for modern web security.\
This combines the strongest browser security with all of the benefits of an SPA architecture:

- [Curity SPA Example](https://github.com/curityio/web-oauth-via-bff)
- [Curity Token Handler API](https://github.com/curityio/bff-node-express)

## Custom Token Handler

This implementation is for my own understanding and to focus on productive developer setups.\
It has some custom code related to expiry testing and custom logging.

## Quick Start

Execute these scripts in sequence to run the Node.js API in Docker using Express:

```bash
./build.sh
./deploy.sh
```

## Testing the OAuth Flow via HTTP

Run `curl` based tests against the OAuth endpoints for the deployed API:

```bash
npm run http
```

## Testing the OAuth Flow via Lambda Functions

The API is deployed to AWS as a low cost Serverless Lambda to serve my [Online SPA](https://authguidance.com/home/code-samples-quickstart/).\
To test the lambda entry points, run the lambda tests:

```bash
npm run lambda
```

## Further Information

See the following blog posts for a more detailed walkthrough and additional options, such as for local API development:

- [Back End for Front End API](https://authguidance.com/2019/04/08/web-reverse-proxy-implementation/)
- [Final SPA](https://authguidance.com/2019/04/07/local-ui-setup/)
