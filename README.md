# OAuth Web Proxy API

An API that shows a modern approach for securing SPAs without any third party browser problems.\
This API is used by the [Final SPA]((https://github.com/gary-archer/oauth.websample.final)) as part of a `Back End for Front End` solution.

## Architecture Goals

Our [Web Architecture Goals](https://authguidance.com/2017/09/08/goal-1-requirements/) are best met by:

- Separating Web and API concerns, to avoid losing good points of an SPA architecture
- Keeping options open about using access tokens in the browser

## Deployment

- This API is deployed to AWS London as a low cost Serverless Lambda
- The SPA is deployed to 20 global locations via AWS Cloudfront, at very low cost

## Cookie Usage

The result of an SPA OpenID Connect login is a cookie containing a refresh token, with the following properties.\
Cookies used only come into play for OAuth related calls and not during Web or API calls.

- HTTP Only
- Secure
- AES 256 encrypted
- SameSite = strict
- Domain = .authsamples.com
- Path = /proxy/spa

## Back End for Front End

This 'Proxy API' does not need to manage any state itself and is deployed as just another microservice.\
The code is a little tricky, but can be coded once, then deployed to multiple web domains.

## Calls from the SPA to Business APIs

These insecure practices have multiple attack vectors and are avoided:

- Storing tokens in unprotected HTML5 storage
- Posting tokens between iframes
- Returning tokens directly after browser redirects

Access tokens are however used in direct HTTPS calls to business APIs.\
Used carefully, access tokens should not have greater browser risks than auth cookies.

## Other Security Measures

The following additional related measures were also taken to reduce token risks:

- The Content Security Policy prevents untrusted domains from executing code
- The Content Security Policy prevents tokens or data being sent to untrusted domains
- In future [DPoP](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-dpop) may further strengthen use of tokens in the browser

## Proxying Business API Calls

Some stakeholders feel uncomfortable about using access tokens in the browser.\
If so then this solution can easily be adapted to also double hop API calls via the Proxy API.

## Developer Setup

Developers now need to run the Proxy API in addition to the SPA on their local workstation.\
The SPA can continue to call deployed business APIs hosted in other domains.
