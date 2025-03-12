#!/bin/bash

# Instal dependensi dengan versi yang stabil
npm install --legacy-peer-deps

# Build aplikasi
npm run build

# Deploy ke Vercel
vercel --prod 