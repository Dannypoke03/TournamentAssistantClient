#!/bin/bash

parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path/../examples"

for dir in $(ls -1 | sort -r)*
do
  echo -ne "Testing: $dir... "\\r
  rm -rf ../examples/$dir/node_modules
  cd "$dir"
  npm install &> /dev/null
  if ! npm run test > /dev/null
  then
    echo "Testing: $dir... [FAIL]"
    exit 1
  else
    echo "Testing: $dir... [OK]"
  fi
  cd ..
done