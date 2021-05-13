# OAuth Web Proxy API

## Overview

An API that will issues SameSite cookies for SPAs as part of a `Back End for Front End` solution.\
I am still playing around with this, but will integrate it with my [Final SPA](https://github.com/gary-archer/oauth.websample.final) when ready.

## Goals

- Separate Web and API concerns, to provide the best [Web Architecture](https://authguidance.com/2017/09/08/goal-1-requirements/) options
- Keep options open about using access tokens in the browser, which can enable some UI composition scenarios
- Continue to enable a productive real world setup on a Developer PC

## Local PC Solution

A developer runs this Proxy API on the local PC, alongside the SPA, but can connect to deployed APIs

## Deployed Solution

This API runs in AWS as a Serverless lambda, while the SPA is deployed to 20 global locations via AWS Cloudfront
