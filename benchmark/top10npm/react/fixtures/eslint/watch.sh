#!/bin/bash
(cd ../.. && yarn build eslint --identifierDescription=NODE_DEV)
(cd ../.. && watchman-make --make 'yarn build eslint --identifierDescription=NODE_DEV' -p 'packages/eslint-plugin-*/**/*' -t ignored)
