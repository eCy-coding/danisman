/**
 * M1 — Command Palette (cmdk) tests
 * TDD: tests first, implementation second
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { COMMAND_REGISTRY } from '../../../lib/command-registry';

// Wrap with MemoryRouter (CommandPalette uses useNavigate)
const renderWithRouter = (ui: React.ReactNode) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  cleanup();
});

afterEach(() => {
  cleanup();
});

describe('CommandPalette', () => {
  it('opens on Cmd+K / Ctrl+K', () => {
    renderWithRouter(<CommandPalette />);
    // Dialog should not be visible initially
    expect(screen.queryByRole('dialog')).toBeNull();

    // Trigger Cmd+K
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('closes on ESC', () => {
    renderWithRouter(<CommandPalette />);

    // Open first
    fireEvent.keyDown(document, { key: 'k', metaKey: true });
    expect(screen.getByRole('dialog')).toBeDefined();

    // Close with ESC
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('fuzzy match filters commands', () => {
    renderWithRouter(<CommandPalette />);

    // Open palette
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(screen.getByRole('dialog')).toBeDefined();

    // Type in search input
    const input = screen.getByPlaceholderText('Komut ara...');
    fireEvent.change(input, { target: { value: 'Dashboard' } });

    // Should show Dashboard result
    expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0);
  });

  it('keyboard arrow navigation (ArrowDown/ArrowUp)', () => {
    renderWithRouter(<CommandPalette />);

    // Open palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    // ArrowDown should not throw and should navigate
    const input = screen.getByPlaceholderText('Komut ara...');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    // Dialog should still be open
    expect(screen.getByRole('dialog')).toBeDefined();
  });

  it('Enter executes command action', () => {
    // We test by checking that when Enter is pressed the palette closes
    renderWithRouter(<CommandPalette />);

    // Open palette
    fireEvent.keyDown(document, { key: 'k', metaKey: true });

    const input = screen.getByPlaceholderText('Komut ara...');
    // filter to single result
    fireEvent.change(input, { target: { value: 'Dashboard' } });
    // Navigate to first item and select
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    // After Enter, palette should close
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('command registry has at least 50 commands', () => {
    expect(COMMAND_REGISTRY.length).toBeGreaterThanOrEqual(50);
  });
});
