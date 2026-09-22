import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('workspace pins package manager and exposes canonical quality commands', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));

  assert.match(pkg.packageManager, /^pnpm@12\./);
  for (const name of ['format:check', 'lint', 'typecheck', 'test:unit']) {
    assert.equal(typeof pkg.scripts[name], 'string');
  }
});
