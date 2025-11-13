// babel.config.js
module.exports = function(api) {
  api.cache(true);
  return {
    // Treat nativewind/react-native-css-interop as a preset because it
    // exports a configuration object with a `plugins` property.
    presets: [
      'babel-preset-expo',
      'nativewind/babel'
    ],
    plugins: [
      'expo-router/babel' // This plugin is required for Expo Router (deprecated in newer SDKs)
    ]
  };
};