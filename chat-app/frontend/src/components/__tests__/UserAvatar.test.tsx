import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserAvatar } from '../UserAvatar/UserAvatar';

describe('UserAvatar', () => {
  it('with src renders img', () => {
    render(<UserAvatar src="https://example.com/pic.png" name="Alice" />);

    const img = screen.getByRole('img', { name: 'Alice' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/pic.png');
  });

  it('without src renders first letter of name', () => {
    render(<UserAvatar name="Bob" />);

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('online prop shows green dot (indicator)', () => {
    const { container } = render(<UserAvatar name="Carol" online />);

    const indicator = container.querySelector('.indicator');
    expect(indicator).toBeInTheDocument();
  });

  it('offline by default has no indicator', () => {
    const { container } = render(<UserAvatar name="Dave" />);

    const indicator = container.querySelector('.indicator');
    expect(indicator).not.toBeInTheDocument();
  });
});
