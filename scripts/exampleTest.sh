#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path/../examples"

for dir in $(ls -1 | sort -r)*
do
  echo "Testing $dir"
  rm -rf ../examples/$dir/node_modules
  cd "$dir"
  npm install
  npm run test
  cd ..
done