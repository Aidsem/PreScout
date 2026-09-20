import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { AppBar } from '../AppBar';

it('presses through the back and profile controls by their accessibility label', () => {
  const onBack = jest.fn();
  const onProfile = jest.fn();
  render(<AppBar title="T" onBack={onBack} onProfile={onProfile} />);
  fireEvent.press(screen.getByLabelText('Back'));
  fireEvent.press(screen.getByLabelText('Profile'));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onProfile).toHaveBeenCalledTimes(1);
});
