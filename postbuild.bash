echo -e "Storing Puppeteer executable in cache\n"

rm -rf ./.cache  # Clear Puppeteer cache
mkdir ./.cache

mv /app/.cache/puppeteer ./.cache
