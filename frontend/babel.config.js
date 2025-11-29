module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [
      'react-native-reanimated/plugin', // Add reanimated (must be last)
    ],
  };
};