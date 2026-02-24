import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Cell } from './Cell';

describe('Cell Component', () => {
  it('renders a base cell appropriately', () => {
    const { container } = render(<Cell x={0} y={0} type="base" color="red" />);
    // Verify it picks up the red base tailwind classes
    expect(container.firstChild).toHaveClass('bg-red-500/40');
  });

  it('renders a path cell appropriately', () => {
    const { container } = render(<Cell x={0} y={0} type="path" color="none" />);
    // Verify it picks up the path standard sizing and color
    expect(container.firstChild).toHaveClass('bg-white/20');
  });

  it('renders a safe zone appropriately', () => {
    const { container } = render(<Cell x={0} y={0} type="safe" color="blue" />);
    expect(container.firstChild).toHaveClass('bg-blue-500/70');
  });

  it('renders cell children properly (e.g. piece)', () => {
    const { getByText } = render(
      <Cell x={0} y={0} type="path" color="none">
        <div>ChildElement</div>
      </Cell>
    );
    expect(getByText('ChildElement')).toBeInTheDocument();
  });
});
