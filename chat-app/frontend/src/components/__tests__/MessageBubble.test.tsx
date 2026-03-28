import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageBubble } from '../MessageBubble/MessageBubble';
import type { Message } from '../../types';

const baseMessage: Message = {
  id: 1,
  chat_id: 1,
  sender_id: 1,
  content: 'Hello World',
  type: 'text',
  created_at: '2026-03-28T14:30:00Z',
};

describe('MessageBubble', () => {
  it('isMine has mine class', () => {
    const { container } = render(<MessageBubble message={baseMessage} isMine />);

    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('mine');
  });

  it('!isMine has other class', () => {
    const { container } = render(<MessageBubble message={baseMessage} isMine={false} />);

    const row = container.firstChild as HTMLElement;
    expect(row.className).toContain('other');
  });

  it('shows content text', () => {
    render(<MessageBubble message={baseMessage} isMine={false} />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('shows formatted time', () => {
    render(<MessageBubble message={baseMessage} isMine />);

    // The component formats to HH:mm locally
    // Just check a time-like pattern exists
    const timeEl = document.querySelector('.time');
    expect(timeEl).toBeInTheDocument();
    expect(timeEl?.textContent).toMatch(/\d{2}:\d{2}/);
  });

  it('shows sender nickname when showSender and !isMine', () => {
    const msg = { ...baseMessage, sender_nickname: 'Alice' };
    render(<MessageBubble message={msg} isMine={false} showSender />);

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });
});
