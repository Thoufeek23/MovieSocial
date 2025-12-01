const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configure blockList to avoid Metro issues
config.resolver.blockList = [
  // Exclude problematic paths
  /node_modules\/expo\/node_modules\/@expo\/cli\/build\/metro-require\/.*/,
];

// Add watchFolders if needed
config.watchFolders = [
  __dirname,
];

module.exports = config;
