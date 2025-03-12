#!/bin/bash

# Install dependencies
npm install

# Build the app
npm run build

# Copy _redirects to dist folder
cp public/_redirects dist/ 