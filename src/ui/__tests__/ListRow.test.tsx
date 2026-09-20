import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ListRow } from '../ListRow';

it('shows title, subtitle, trailing and handles press', () => {
  const onPress = jest.fn();
  render(<ListRow title="DRONE-01" subtitle="Recon" trailing={<Text>4m</Text>} onPress={onPress} testID="row" />);
  expect(screen.getByText('DRONE-01')).toBeTruthy();
  expect(screen.getByText('Recon')).toBeTruthy();
  expect(screen.getByText('4m')).toBeTruthy();
  fireEvent.press(screen.getByTestId('row'));
  expect(onPress).toHaveBeenCalled();
});
