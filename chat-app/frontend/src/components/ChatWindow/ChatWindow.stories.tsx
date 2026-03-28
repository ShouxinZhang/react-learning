import type { Meta, StoryObj } from '@storybook/react';
import { ChatWindow } from './ChatWindow';

const meta: Meta<typeof ChatWindow> = {
  title: 'Components/ChatWindow',
  component: ChatWindow,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatWindow>;

export const EmptyState: Story = {
  args: {
    chatId: null,
  },
};
