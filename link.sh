# this file is used for local development
# it links the syntest-framework libraries to the syntest-javascript libraries

# NOTE: we cannot simply delete the entire @syntest folder since there are always local syntest-javascript dependencies here

# framework libraries

rm -rf node_modules/@syntest/analysis
rm -rf node_modules/@syntest/cfg
rm -rf node_modules/@syntest/cli-graphics
rm -rf node_modules/@syntest/diagnostics
rm -rf node_modules/@syntest/logging
rm -rf node_modules/@syntest/metric
rm -rf node_modules/@syntest/module
rm -rf node_modules/@syntest/prng
rm -rf node_modules/@syntest/search
rm -rf node_modules/@syntest/storage

# framework plugins
rm -rf node_modules/@syntest/plugin-event-listener-state-storage
rm -rf node_modules/@syntest/plugin-event-listener-websocket
rm -rf node_modules/@syntest/plugin-metric-middleware-file-writer
rm -rf node_modules/@syntest/plugin-metric-middleware-statistics
rm -rf node_modules/@syntest/plugin-search-algorithm-experimental

# framework tools
rm -rf node_modules/@syntest/base-language
rm -rf node_modules/@syntest/cli
rm -rf node_modules/@syntest/init


cd node_modules/@syntest

# framework libraries
ln -s ../../../syntest-core/libraries/analysis analysis
ln -s ../../../syntest-core/libraries/cfg cfg
ln -s ../../../syntest-core/libraries/cli-graphics cli-graphics
ln -s ../../../syntest-core/libraries/diagnostics diagnostics
ln -s ../../../syntest-core/libraries/logging logging
ln -s ../../../syntest-core/libraries/metric metric
ln -s ../../../syntest-core/libraries/module module
ln -s ../../../syntest-core/libraries/prng prng
ln -s ../../../syntest-core/libraries/search search
ln -s ../../../syntest-core/libraries/storage storage

# framework plugins
ln -s ../../../syntest-core/plugins/plugin-event-listener-state-storage plugin-event-listener-state-storage
ln -s ../../../syntest-core/plugins/plugin-event-listener-websocket plugin-event-listener-websocket
ln -s ../../../syntest-core/plugins/plugin-metric-middleware-file-writer plugin-metric-middleware-file-writer
ln -s ../../../syntest-core/plugins/plugin-metric-middleware-statistics plugin-metric-middleware-statistics
ln -s ../../../syntest-core/plugins/plugin-search-algorithm-experimental plugin-search-algorithm-experimental

# framework tools
ln -s ../../../syntest-framework/tools/cli cli
ln -s ../../../syntest-framework/tools/base-language base-language
ln -s ../../../syntest-framework/tools/init init
