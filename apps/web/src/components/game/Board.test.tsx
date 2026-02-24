import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Board } from './Board';

describe('Board Component', () => {
  it('renders without crashing and outputs 225 cells (15x15)', () => {
    const { container } = render(<Board />);
    
    // Board should have a container rendering the CSS grid
    expect(container.firstChild).toBeInTheDocument();

    // The grid should have exactly 225 children (cells)
    const gridContainer = container.querySelector('.grid-cols-15');
    expect(gridContainer?.children.length).toBe(225);
  });
});
