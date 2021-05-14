# OAuth Web Proxy API

## Overview

An API that issues SameSite cookies for SPAs as part of a `Back End for Front End` solution.\
Used by the [Final SPA](https://github.com/gary-archer/oauth.websample.final) to improve security, reliability and to simplify SPA code.

## Coding Goal

- Separate Web and API concerns, to provide the best [Web Architecture](https://authguidance.com/2017/09/08/goal-1-requirements/) options

## Local PC Solution

A developer must runs this Proxy API on the local PC alongside the SPA.\
Once the SPA has an access token it can use it to call remote APIs.

## Deployed Solution

This API runs in AWS as a low cost Serverless lambda.\
The SPA is deployed to 20 global locations via AWS Cloudfront.
