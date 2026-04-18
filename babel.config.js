module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for Expo/React Native
      'react-native-reanimated/plugin',
    ],
  };
};
