import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BarcodeGenerator from '../BarcodeGenerator';

describe('BarcodeGenerator', () => {
  it('renders without crashing', () => {
    render(<BarcodeGenerator value="TEST123" />);
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('displays a message when no value is provided', () => {
    render(<BarcodeGenerator value="" />);
    expect(screen.getByText('No barcode data')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <BarcodeGenerator value="TEST123" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
