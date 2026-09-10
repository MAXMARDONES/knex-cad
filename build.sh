#!/bin/bash
# Concatenate the engine into dist/knex.js (used by cli.js and inlined into the viewer)
cd "$(dirname "$0")"
cat engine/*.js > dist/knex.js && node --check dist/knex.js && echo "dist/knex.js $(wc -c < dist/knex.js) bytes"
