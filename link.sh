# this file is used for local development
# it links the syntest-core libraries to the syntest-javascript libraries

# NOTE: we cannot simply delete the entire @syntest folder since there are always local syntest-javascript dependencies here

# core libraries

rm -rf node_modules/@syntest/analysis
rm -rf node_modules/@syntest/cfg
rm -rf node_modules/@syntest/cli-graphics
rm -rf node_modules/@syntest/logging
rm -rf node_modules/@syntest/metric
rm -rf node_modules/@syntest/module
rm -rf node_modules/@syntest/search
rm -rf node_modules/@syntest/storage
rm -rf node_modules/@syntest/prng

# core plugins
rm -rf node_modules/@syntest/plugin-core-event-listener-graphing
rm -rf node_modules/@syntest/plugin-core-event-listener-state-storage
rm -rf node_modules/@syntest/plugin-core-event-listener-websocket
rm -rf node_modules/@syntest/plugin-core-metric-middleware-file-writer
rm -rf node_modules/@syntest/plugin-core-metric-middleware-statistics
rm -rf node_modules/@syntest/plugin-core-search-algorithm-experimental

# core tools
rm -rf node_modules/@syntest/base-language
rm -rf node_modules/@syntest/cli
rm -rf node_modules/@syntest/init


cd node_modules/@syntest

# core libraries
ln -s ../../../syntest-core/libraries/analysis analysis
ln -s ../../../syntest-core/libraries/cfg cfg
ln -s ../../../syntest-core/libraries/cli-graphics cli-graphics
ln -s ../../../syntest-core/libraries/logging logging
ln -s ../../../syntest-core/libraries/metric metric
ln -s ../../../syntest-core/libraries/module module
ln -s ../../../syntest-core/libraries/search search
ln -s ../../../syntest-core/libraries/storage storage
ln -s ../../../syntest-core/libraries/prng prng

# core plugins
ln -s ../../../syntest-core/plugins/plugin-core-event-listener-graphing plugin-core-event-listener-graphing
ln -s ../../../syntest-core/plugins/plugin-core-event-listener-state-storage plugin-core-event-listener-state-storage
ln -s ../../../syntest-core/plugins/plugin-core-event-listener-websocket plugin-core-event-listener-websocket
ln -s ../../../syntest-core/plugins/plugin-core-metric-middleware-file-writer plugin-core-metric-middleware-file-writer
ln -s ../../../syntest-core/plugins/plugin-core-metric-middleware-statistics plugin-core-metric-middleware-statistics
ln -s ../../../syntest-core/plugins/plugin-core-search-algorithm-experimental plugin-core-search-algorithm-experimental

# core tools
ln -s ../../../syntest-core/tools/cli cli
ln -s ../../../syntest-core/tools/base-language base-language
ln -s ../../../syntest-core/tools/init init