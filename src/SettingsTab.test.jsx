import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsTab } from './SettingsTab';

describe('SettingsTab', () => {
  it('renders a clear saved key action and calls the handler', async () => {
    const user = userEvent.setup();
    const onClearGeminiApiKey = vi.fn();

    render(
      <SettingsTab
        settings={{
          historyLimitGb: '0.005',
          geminiApiKey: 'secret-key'
        }}
        onInputChange={vi.fn()}
        onClearGeminiApiKey={onClearGeminiApiKey}
      />
    );

    await user.click(screen.getByRole('button', { name: /clear saved key/i }));

    expect(onClearGeminiApiKey).toHaveBeenCalledTimes(1);
  });

  it('disables the clear action when no key is stored', () => {
    render(
      <SettingsTab
        settings={{
          historyLimitGb: '0.005',
          geminiApiKey: ''
        }}
        onInputChange={vi.fn()}
        onClearGeminiApiKey={vi.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /clear saved key/i })).toBeDisabled();
  });
});