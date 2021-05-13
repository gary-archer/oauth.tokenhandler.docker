# OAuth Web Proxy API

## Overview

An API that will issues SameSite cookies for SPAs as part of a `Back End for Front End` solution.

## Goals

- Separate Web and API concerns, to provide the best [Web Architecture](https://authguidance.com/2017/09/08/goal-1-requirements/) options
- Keep options open about using access tokens in the browser, which can enable some UI composition scenarios
- Continue to enable a productive real world setup on a Developer PC

## Local PC Solution

A developer runs this Proxy API alongside the SPA, but can connect to deployed APIs

## Deployed Solution

Runs in AWS as a Serverless lambda for low cost hosting
