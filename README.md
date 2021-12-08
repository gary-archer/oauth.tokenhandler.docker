# OAuth Token Handler API

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/bc52d166f1624ef9a2c0cfbf283deb23)](https://www.codacy.com/gh/gary-archer/oauth.webproxyapi/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=gary-archer/oauth.webproxyapi&amp;utm_campaign=Badge_Grade)

[![Known Vulnerabilities](https://snyk.io/test/github/gary-archer/oauth.webproxyapi/badge.svg?targetFile=package.json)](https://snyk.io/test/github/gary-archer/oauth.webproxyapi?targetFile=package.json)

An API that implements OpenID Connect security on behalf of a Single Page Application, in the optimal API driven manner.

## Modern Web Security

My blog's [Final SPA](https://github.com/gary-archer/oauth.websample.final) uses Curity's [Token Handler Pattern](https://github.com/curityio/web-oauth-via-bff) and calls this API to perform OAuth work.\
This combines strongest browser security with all of the benefits of an SPA architecture.

## Custom Token Handler API

This implementation has some custom code related to expiry testing, custom logging and deployment automation:

- Runs as a Serverless Lambda for my deployed cloud system
- Runs in Express when I want to deploy it to Kubernetes

## Quick Start

Add these development domains to your hosts file:

```text
127.0.0.1 web.mycompany.com api.mycompany.com
::1       localhost
````

Then run these commands to build and run the API:

```bash
./build.sh
./run.sh
```

Test Express operations via this command:

```bash
npm run http
```

Test Lambda operations via this command:

```bash
npm run lambda
```

## Blog Post

See the [Token Handler API](https://authguidance.com/2019/04/08/web-reverse-proxy-implementation/) blog post for further details.
