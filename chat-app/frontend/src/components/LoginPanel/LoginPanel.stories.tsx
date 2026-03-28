import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPanel } from './LoginPanel';

const meta: Meta<typeof LoginPanel> = {
  title: 'Components/LoginPanel',
  component: LoginPanel,
  decorators: [(Story) => <BrowserRouter><Story /></BrowserRouter>],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof LoginPanel>;

export const Default: Story = {};
