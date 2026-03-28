import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { MessageInput } from './MessageInput';

const meta: Meta<typeof MessageInput> = {
  title: 'Components/MessageInput',
  component: MessageInput,
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 500, border: '1px solid var(--border-color)' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageInput>;

export const Default: Story = {
  args: { onSend: fn() },
};

export const Disabled: Story = {
  args: { onSend: fn(), disabled: true },
};
