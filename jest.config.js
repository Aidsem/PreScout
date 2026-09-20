module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.claude/', '/server/', '/shared/'],
  resolver: 'react-native-worklets/jest/resolver.js',
};
