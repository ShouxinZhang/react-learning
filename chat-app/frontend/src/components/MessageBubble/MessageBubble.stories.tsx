import type { Meta, StoryObj } from '@storybook/react';
import type { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

const baseMessage: Message = {
  id: 1,
  chat_id: 1,
  sender_id: 1,
  content: '你好！',
  type: 'text',
  created_at: '2026-03-28T14:30:00Z',
  sender_nickname: 'Alice',
};

const meta: Meta<typeof MessageBubble> = {
  title: 'Components/MessageBubble',
  component: MessageBubble,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 500, background: 'var(--chat-bg)', padding: 16 }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

export const MyMessage: Story = {
  args: { message: { ...baseMessage, content: '今天天气真好！' }, isMine: true },
};

export const OtherMessage: Story = {
  args: { message: { ...baseMessage, content: '是啊，一起出去走走？' }, isMine: false },
};

export const LongText: Story = {
  args: {
    message: {
      ...baseMessage,
      content:
        '这是一段很长的文本，用来测试气泡的自动换行效果。微信的消息气泡会限制在最大宽度 70% 以内，多余的文字会自动换行显示。这段文字足够长，应该可以看到换行效果了吧？如果还不够长就再加一点点内容好了。',
    },
    isMine: false,
  },
};

export const WithSender: Story = {
  args: {
    message: { ...baseMessage, content: '大家好！', sender_nickname: 'Alice' },
    isMine: false,
    showSender: true,
  },
};
