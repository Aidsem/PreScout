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
// Vector icons load their font asynchronously and set state after render,
// which surfaces as "not wrapped in act" noise in component tests.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = (props) => React.createElement(Text, { testID: props.testID, accessibilityLabel: props.name }, props.name);
  return new Proxy({}, { get: (_target, key) => (key === '__esModule' ? true : Icon) });
});
