# Docker Based Token Handler

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.tokenhandler.docker/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.tokenhandler.docker&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.tokenhandler.docker/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.tokenhandler.docker?targetFile=package.json)

Utility API support for a Single Page Application, to enable OpenID Connect security and use of secure cookies.\
The [Final SPA](https://github.com/gary-archer/oauth.websample.final) uses Curity's [Token Handler Pattern](https://github.com/curityio/spa-using-token-handler) and calls this API to perform OAuth related work.

## Custom Implementation

This repo provides an OAuth Agent with custom code related to expiry testing and API logging.\
It enables my [End-to-end SPA and API](https://github.com/gary-archer/oauth.cloudnative.deployment) to run in Kubernetes with the desired behaviour.

## Quick Start

To run this component on a development computer, first add the local development domain to your hosts file:

```text
127.0.0.1 localtokenhandler.authsamples-dev.com
::1       localhost
````

Then run this command to build and run the API in Express:

```bash
./start.sh
```

Trust the development certificate downloaded to the local computer:

```text
```

Then test API operations with this command:

```bash
npm run test
```
