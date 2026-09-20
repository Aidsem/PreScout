import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { StatusPill } from '../StatusPill';
import { Colors } from '../../theme';

it('renders the status text in its tone colour', () => {
  render(<StatusPill status="EN ROUTE" />);
  const text = screen.getByText('EN ROUTE');
  expect(text.props.style).toEqual(expect.arrayContaining([expect.objectContaining({ color: Colors.accent })]));
});
