import type { Meta, StoryObj } from '@storybook/react';
import { GroupManager } from './GroupManager';

const meta: Meta<typeof GroupManager> = {
  title: 'Components/GroupManager',
  component: GroupManager,
  parameters: { layout: 'fullscreen' },
  argTypes: {
    mode: { control: 'select', options: ['create', 'manage'] },
    onClose: { action: 'close' },
  },
};

export default meta;
type Story = StoryObj<typeof GroupManager>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
    onClose: () => {},
  },
};

export const ManageMode: Story = {
  args: {
    mode: 'manage',
    chatId: 1,
    onClose: () => {},
  },
};
