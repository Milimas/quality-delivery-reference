import { stat, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('README exposes the five-minute path and honest evidence boundary', async () => {
  const readme = await readFile('README.md', 'utf8');
  for (const command of [
    './scripts/bootstrap',
    'make check-fast',
    'make integration',
    'make docs-build'
  ]) {
    assert.match(readme, new RegExp(command.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(readme, /does not deploy to production/i);
  assert.match(readme, /beihaqi\.com\/blog\/from-code-to-production/);
});

test('clean-clone verifier is executable and guards destructive targets', async () => {
  const script = await readFile('scripts/verify-clean-clone', 'utf8');
  assert.match(script, /destination directory must be empty/);
  assert.match(script, /refusing unsafe destination/);
  assert.ok((await stat('scripts/verify-clean-clone')).mode & 0o100);
});
