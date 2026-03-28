import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MessageInput } from '../MessageInput/MessageInput';

describe('MessageInput', () => {
  it('renders textarea and send button', () => {
    render(<MessageInput onSend={vi.fn()} />);

    expect(screen.getByPlaceholderText('输入消息…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '发送' })).toBeInTheDocument();
  });

  it('send button disabled when empty', () => {
    render(<MessageInput onSend={vi.fn()} />);

    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled();
  });

  it('typing and pressing Enter calls onSend', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('输入消息…');
    await user.type(textarea, 'Hello{Enter}');

    expect(onSend).toHaveBeenCalledWith('Hello');
  });

  it('Shift+Enter does NOT call onSend', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('输入消息…');
    await user.type(textarea, 'Line1{Shift>}{Enter}{/Shift}Line2');

    expect(onSend).not.toHaveBeenCalled();
  });

  it('after send, textarea is cleared', async () => {
    const user = userEvent.setup();
    render(<MessageInput onSend={vi.fn()} />);

    const textarea = screen.getByPlaceholderText('输入消息…');
    await user.type(textarea, 'Hello{Enter}');

    expect(textarea).toHaveValue('');
  });

  it('clicking send button calls onSend and clears input', async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText('输入消息…');
    await user.type(textarea, 'World');
    await user.click(screen.getByRole('button', { name: '发送' }));

    expect(onSend).toHaveBeenCalledWith('World');
    expect(textarea).toHaveValue('');
  });
});
