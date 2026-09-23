import assert from 'node:assert/strict';
import { readFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { beforeEach, test } from 'node:test';

const evidencePath = 'artifacts/tests/service-tests.json';

beforeEach(async () => {
  await rm(evidencePath, { force: true });
});

function runServiceTests(command) {
  return spawnSync('scripts/quality/service-tests', {
    encoding: 'utf8',
    env: { ...process.env, QUALITY_TEST_COMMAND: command }
  });
}

async function readEvidence() {
  return JSON.parse(await readFile(evidencePath, 'utf8'));
}

test('records passing unit and component evidence without retries', async () => {
  const result = runServiceTests("node -e 'process.exit(0)'");
  assert.equal(result.status, 0, result.stderr);

  const evidence = await readEvidence();
  assert.equal(evidence.environmentClassification, 'local-or-ci');
  assert.equal(evidence.retryCount, 0);
  assert.equal(evidence.result, 'passed');
  assert.ok(evidence.durationMs >= 0);
  assert.deepEqual(
    evidence.suites.map(({ name }) => name),
    ['unit', 'component']
  );
});

test('preserves a failing command status without retrying it', async () => {
  const result = runServiceTests("node -e 'process.exit(7)'");
  assert.equal(result.status, 7, result.stderr);

  const evidence = await readEvidence();
  assert.equal(evidence.result, 'failed');
  assert.equal(evidence.retryCount, 0);
  assert.deepEqual(
    evidence.suites.map(({ result: suiteResult }) => suiteResult),
    ['failed', 'failed']
  );
});
