#!/bin/bash

echo -e "Storing Puppeteer executable in cache\n"

mkdir -p /app/.cache/puppeteer

rm -rf ./.cache

mkdir -p ./.cache

if [ -d "/app/.cache/puppeteer" ]; then
    echo "Moving Puppeteer cache to local cache directory"
    mv /app/.cache/puppeteer ./.cache/
else
    echo "No Puppeteer cache found in /app/.cache/puppeteer"
fi
