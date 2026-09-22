import { readdir, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('pull request workflow exposes an authoritative stable gate', async () => {
  const workflow = await readFile('.github/workflows/pull-request.yml', 'utf8');
  assert.match(workflow, /^permissions:\n {2}contents: read$/m);
  assert.match(workflow, /^ {2}quality-gate:$/m);
  assert.match(workflow, /^ {4}if: always\(\)$/m);
  assert.match(workflow, /needs: \[fast, tests, contracts, integration, security\]/);
  assert.match(workflow, /process\.exit\(1\)/);
});

test('every third-party action is pinned to an immutable SHA', async () => {
  const workflows = await readdir('.github/workflows');
  for (const name of workflows) {
    const workflow = await readFile(`.github/workflows/${name}`, 'utf8');
    assert.doesNotMatch(workflow, /uses: [^\n]+@(v|main|master)/, name);
    for (const match of workflow.matchAll(/uses: [^\s@]+@([^\s#]+)/g)) {
      assert.match(match[1], /^[0-9a-f]{40}$/, `${name}: ${match[0]}`);
    }
  }
});

test('nightly workflow is scheduled and never claims production verification', async () => {
  const workflow = await readFile('.github/workflows/nightly.yml', 'utf8');
  assert.match(workflow, /cron:/);
  assert.match(workflow, /No production environment is exercised/);
});
