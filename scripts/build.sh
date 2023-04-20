#!/bin/bash

# cd to the root dir
ROOT="$(pwd)/$(dirname "$0")/.."
cd "$ROOT" || exit 1

DIR="$ROOT/dist"
SRC_DIR="$DIR/tsOut"

# Clean up output dir
rm -rf "$DIR"
mkdir -p "$DIR"

npx tsc || exit 1
node esbuild.js || exit 1

for file in $(find ./dist -type f -name '*.js'); do
    npx uglifyjs $file -c -o $file &
done

wait
