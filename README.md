# Docker Based Token Handler

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.tokenhandler.docker/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.tokenhandler.docker&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.tokenhandler.docker/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.tokenhandler.docker?targetFile=package.json)

API Driven OpenID Connect for Single Page Applications.\
The [Final SPA](https://github.com/gary-archer/oauth.websample.final) uses Curity's [Token Handler Pattern](https://github.com/curityio/spa-using-token-handler) and calls this API to perform OAuth related work.

## Overview

This repo provides an OAuth Agent that can run on a developemnt computer, with some custom expiry testing and logging behavior.\
Two deployment scenarios are supported:

- The token handler can route local SPA to local API requests, when it runs at https://localtokenhandler.authsamples-dev.com:444
- The token handler can be deployed to Kubernetes as part of an [End-to-end SPA and API](https://github.com/gary-archer/oauth.cloudnative.deployment) setup

## Local Development Quick Start

To run this component on a development computer, first add the local development domain to your hosts file:

```text
127.0.0.1 localtokenhandler.authsamples-dev.com
::1       localhost
````

Then run this command to build and run the API in Express:

```bash
./start.sh
```

Trust the root certificate that the build step downloads to your computer, so that SSL works in the browser.
Add this file to the system keychain on macOS or the Windows certificate trust store for the local computer:

```text
./certs/authsamples-dev.ca.pem
```

Then test all OAuth operations with this command:

```bash
npm test
```
