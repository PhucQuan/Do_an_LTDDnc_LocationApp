const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Some Windows environments block Metro worker child-process spawning with EPERM.
// Worker threads avoid that path and keep Expo Go from hanging on the loading spinner.
config.maxWorkers = 1;
config.transformer.unstable_workerThreads = true;
config.watcher.unstable_workerThreads = true;

module.exports = config;
