import type { Meta, StoryObj } from '@storybook/react';
import { UserAvatar } from './UserAvatar';

const meta: Meta<typeof UserAvatar> = {
  title: 'Components/UserAvatar',
  component: UserAvatar,
  parameters: { layout: 'centered' },
};

export default meta;
type Story = StoryObj<typeof UserAvatar>;

export const WithImage: Story = {
  args: { src: 'https://i.pravatar.cc/150?u=alice', name: 'Alice' },
};

export const WithoutImage: Story = {
  args: { name: 'Bob' },
};

export const SmallSize: Story = {
  args: { name: 'Charlie', size: 'sm' },
};

export const MediumSize: Story = {
  args: { name: 'Diana', size: 'md' },
};

export const LargeSize: Story = {
  args: { name: 'Eve', size: 'lg' },
};

export const Online: Story = {
  args: { name: 'Frank', online: true },
};

export const Offline: Story = {
  args: { name: 'Grace', online: false },
};
