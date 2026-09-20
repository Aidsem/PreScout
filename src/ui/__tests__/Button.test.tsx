import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from '../Button';

describe('Button', () => {
  it('calls onPress with its label visible', () => {
    const onPress = jest.fn();
    render(<Button label="Dispatch" onPress={onPress} />);
    fireEvent.press(screen.getByText('Dispatch'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
  it('blocks onPress and shows a spinner while loading', () => {
    const onPress = jest.fn();
    render(<Button label="Dispatch" onPress={onPress} loading testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByTestId('btn-spinner')).toBeTruthy();
  });
  it('blocks onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="Dispatch" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
