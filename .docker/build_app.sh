#!/bin/bash
set -e

cp -R /clone /source
rm -rf /clone
echo "Building app dependencies..."
cd /source && meteor npm install

echo "Building app..."
NODE_OPTIONS=' --max_old_space_size=4096 ' meteor build --architecture=os.linux.x86_64 --directory /app --server=http://localhost:3000
rm -rf ~/.meteor
rm /usr/local/bin/meteor
rm -rf /source

echo "Building meteor dependencies..."
cd /app/bundle/programs/server
meteor npm install --production
npm cache clear
