import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

describe('test-environment mocks', () => {
  it('AsyncStorage round-trips a value in memory', async () => {
    await AsyncStorage.setItem('k', 'v');
    expect(await AsyncStorage.getItem('k')).toBe('v');
  });

  it('NetInfo.fetch resolves a connected state', async () => {
    const state = await NetInfo.fetch();
    expect(state.isConnected).toBe(true);
  });
});
