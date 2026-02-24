import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Piece } from './Piece';

describe('Piece Component', () => {
  it('renders with correct color styling for red', () => {
    const { container } = render(<Piece color="red" id="r1" />);
    expect(container.firstChild).toHaveClass('from-red-500');
  });

  it('handles click events if provided', () => {
    const mockClick = vi.fn();
    const { container } = render(<Piece color="green" id="g1" onClick={mockClick} />);
    
    // Simulate click on the piece div
    if (container.firstChild) {
      fireEvent.click(container.firstChild as Element);
      expect(mockClick).toHaveBeenCalledTimes(1);
    }
  });
});
