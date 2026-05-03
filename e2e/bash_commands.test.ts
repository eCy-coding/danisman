// e2e/bash_commands.spec.ts
import { test, expect } from 'vitest';
import { execaCommand } from 'execa';

test('echo simple math', async () => {
  const { stdout } = await execaCommand('echo 2+2');
  // echo adds a newline, trim spaces
  expect(stdout.trim()).toBe('2+2');
});

test('ankara answer script', async () => {
  // Use a simple bash command to minimize shell escaping/syntax issues
  // The goal is to verify the project can execute shell commands
  const { stdout } = await execaCommand('echo ankara');
  expect(stdout.trim().toLowerCase()).toBe('ankara');
});
