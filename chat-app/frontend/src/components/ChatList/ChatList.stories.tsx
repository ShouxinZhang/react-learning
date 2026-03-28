import type { Meta, StoryObj } from '@storybook/react';
import { ChatList } from './ChatList';

const meta: Meta<typeof ChatList> = {
  title: 'Components/ChatList',
  component: ChatList,
};

export default meta;
type Story = StoryObj<typeof ChatList>;

export const Default: Story = {};
