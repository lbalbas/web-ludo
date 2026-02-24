import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GamePage } from './GamePage';

describe('GamePage Component', () => {
  it('renders the core game interface elements', () => {
    const { getByText } = render(<GamePage onLeave={vi.fn()} />);
    
    expect(getByText('Local Match')).toBeInTheDocument();
    expect(getByText('Player 1 (Red)')).toBeInTheDocument();
    expect(getByText('Leave')).toBeInTheDocument();
  });

  it('triggers onLeave callback when pressing Leave button', () => {
    const mockLeave = vi.fn();
    const { getByText } = render(<GamePage onLeave={mockLeave} />);
    
    const leaveBtn = getByText('Leave');
    fireEvent.click(leaveBtn);

    expect(mockLeave).toHaveBeenCalledTimes(1);
  });
});
