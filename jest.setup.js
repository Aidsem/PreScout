jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-native-community/netinfo', () =>
  require('@react-native-community/netinfo/jest/netinfo-mock.js')
);
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
jest.mock('lottie-react-native', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { __esModule: true, default: (props) => React.createElement(View, { testID: props.testID ?? 'lottie' }) };
});
