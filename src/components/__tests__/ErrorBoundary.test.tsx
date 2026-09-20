import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';

function Bomb(): React.ReactElement {
  throw new Error('boom');
}

describe('ErrorBoundary', () => {
  it('renders the SYSTEM FAULT fallback when a child throws', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    expect(screen.getByText('SYSTEM FAULT')).toBeTruthy();
  });

  it('renders children normally when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Text>All systems nominal</Text>
      </ErrorBoundary>
    );

    expect(screen.getByText('All systems nominal')).toBeTruthy();
  });
});
