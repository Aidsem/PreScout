import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Card } from '../Card';

it('renders children and handles press when pressable', () => {
  const onPress = jest.fn();
  render(<Card pressable onPress={onPress} testID="card"><Text>Body</Text></Card>);
  expect(screen.getByText('Body')).toBeTruthy();
  expect(screen.getByRole('button')).toBeTruthy();
  fireEvent.press(screen.getByTestId('card'));
  expect(onPress).toHaveBeenCalled();
});
