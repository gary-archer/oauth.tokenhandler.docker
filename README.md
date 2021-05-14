# OAuth Web Proxy API

## Overview

An API that issues SameSite cookies for SPAs as part of a `Back End for Front End` solution

## Goals

- Separate Web and API concerns, to provide the best [Web Architecture](https://authguidance.com/2017/09/08/goal-1-requirements/) options.
- Keep options open about using access tokens in the browser, which can enable some UI composition scenarios.

## Local PC Solution

A developer must runs this Proxy API on the local PC alongside the SPA.\
Once the SPA has an access token it can use it to call remote APIs.

## Deployed Solution

This API runs in AWS as a low cost Serverless lambda.\
The SPA is deployed to 20 global locations via AWS Cloudfront.
