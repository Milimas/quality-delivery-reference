import { cp, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '../..');

function run(command, args, cwd, env = {}) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', env: { ...process.env, ...env } });
}

test('contract gate reports an incompatible response-field removal', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'contract-gate-'));
  await cp(path.join(projectRoot, 'contracts'), path.join(fixture, 'contracts'), {
    recursive: true
  });
  await cp(path.join(projectRoot, 'scripts'), path.join(fixture, 'scripts'), { recursive: true });
  assert.equal(run('git', ['init', '-b', 'main'], fixture).status, 0);
  run('git', ['config', 'user.email', 'quality@example.test'], fixture);
  run('git', ['config', 'user.name', 'Quality Reference'], fixture);
  run('git', ['add', '.'], fixture);
  assert.equal(run('git', ['commit', '-m', 'baseline'], fixture).status, 0);

  const pricingPath = path.join(fixture, 'contracts/pricing.openapi.yaml');
  const contract = await readFile(pricingPath, 'utf8');
  const incompatible = contract.replace('        - totalCents\n', '');
  assert.notEqual(incompatible, contract, 'fixture mutation must remove the required field');
  await writeFile(pricingPath, incompatible);

  const result = run('/bin/sh', ['scripts/quality/contracts'], fixture, { BASE_REF: 'main' });
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(`${result.stdout}${result.stderr}`, /totalCents/);
  assert.match(`${result.stdout}${result.stderr}`, /v1\/prices\/quote/);
});
