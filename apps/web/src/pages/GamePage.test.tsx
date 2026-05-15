import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GamePage } from './GamePage';

describe('GamePage Component', () => {
  it('renders the core game interface elements in local mode', () => {
    const { getByText } = render(<GamePage onLeave={vi.fn()} lobbyId="local-match" />);
    
    expect(getByText('Local Match')).toBeInTheDocument();
    expect(getByText('Leave')).toBeInTheDocument();
    expect(getByText('Current Turn')).toBeInTheDocument();
  });

  it('renders "Online Match" header when given a lobby id', () => {
    // This will try to connect to a WebSocket that doesn't exist,
    // but the component still renders with the initial state.
    const { getByText } = render(<GamePage onLeave={vi.fn()} lobbyId="some-lobby-id" />);
    
    expect(getByText('Online Match')).toBeInTheDocument();
  });

  it('shows all four player color slots', () => {
    const { getAllByText } = render(<GamePage onLeave={vi.fn()} lobbyId="local-match" />);
    
    expect(getAllByText('Red').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Green').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Yellow').length).toBeGreaterThanOrEqual(1);
    expect(getAllByText('Blue').length).toBeGreaterThanOrEqual(1);
  });
});
