#!/bin/bash

modelsDir="./src/models/proto"
protosDir="./TournamentAssistantProtos"

# Check if protoc is installed
if ! command -v protoc &> /dev/null
then
    echo "Protoc command could not be found, please install it and try again."
    exit
fi

if [[ ! -d $protosDir ]]; then
    echo "Initialising submodule..."
    git submodule update --init --recursive
fi

if [[ -d $modelsDir ]]; then
    echo "Removing old proto files..."
    rm -rf $modelsDir
fi
mkdir $modelsDir

echo "Generating proto files..."

if protoc -I=$protosDir $protosDir/*.proto --ts_out="$modelsDir" --plugin=protoc-gen-ts=./node_modules/.bin/protoc-gen-ts; then
    echo "Successfully generated proto files."
else
    echo "Failed to generate proto files."
    exit
fi

# Update models namespace
sed -i 's/proto.models/Models/g' $modelsDir/*.ts
# Update packet namespace
sed -i 's/proto.packet/Packets/g' $modelsDir/*.ts
# Use private instead of # for private fields
sed -i 's/#one_of_decls:/private one_of_decls:/g' $modelsDir/*.ts
sed -i 's/this.#one_of_decls/this.one_of_decls/g' $modelsDir/*.ts

# Fix packed int32
sed -i 's/message.difficulties = reader.readPackedInt32();/var values = reader.isDelimited() ? reader.readPackedInt32() : [reader.readInt32()];\
                        for (var i = 0; i < values.length; i++) {\
                            message.difficulties.push(values[i]);\
                        }/g' $modelsDir/*.ts
