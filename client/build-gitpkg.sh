#!/bin/sh

yarn --ignore-scripts && # install client deps
yarn build && # build client
cd .. && # go up into root
find . -maxdepth 1 ! -name 'client' ! -name '.' ! -name '..'  -type d -exec rm -rf {} + && # delete all directories in root except 'client'
find . -maxdepth 1 -type f -exec rm -rf {} + && # delete all files in root
mv client/* . # move client files up into package root
