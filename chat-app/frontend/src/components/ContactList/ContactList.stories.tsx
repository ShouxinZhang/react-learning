import type { Meta, StoryObj } from '@storybook/react';
import { ContactList } from './ContactList';

const meta: Meta<typeof ContactList> = {
  title: 'Components/ContactList',
  component: ContactList,
};

export default meta;
type Story = StoryObj<typeof ContactList>;

export const Default: Story = {};
