import { access, readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import test from 'node:test';

test('documentation assets resolve beneath the GitHub Pages project path', async () => {
  const { default: config } = await import('../../docs/.vitepress/config.ts');
  assert.equal(config.base, '/quality-delivery-reference/');
});

test('every framework stage is classified and production claims are qualified', async () => {
  const matrix = await readFile('docs/framework/verification-matrix.md', 'utf8');
  for (const stage of [
    'Development',
    'Pull request',
    'Main',
    'Nightly',
    'Pre-production',
    'Production canary',
    'Production ongoing'
  ]) {
    assert.match(
      matrix,
      new RegExp(`\\| ${stage}\\s+\\|.*\\| (Executable|Configurable|Documented)\\s+\\|`)
    );
  }
  assert.match(matrix, /No production environment is exercised by this repository/);
});

test('production guide names every operational prerequisite category', async () => {
  const guide = await readFile('docs/production/requirements.md', 'utf8');
  for (const heading of [
    'Artifact registry',
    'Workload identity',
    'Progressive rollout and rollback',
    'Database migrations',
    'Telemetry and ownership',
    'SLIs, SLOs, and canary policy',
    'Security scanning',
    'Test data and resilience',
    'Incident response and audit'
  ]) {
    assert.match(guide, new RegExp(`## ${heading}`));
  }
});

test('the source framework is credited and core pages exist', async () => {
  const home = await readFile('docs/index.md', 'utf8');
  assert.match(home, /beihaqi\.com\/blog\/from-code-to-production/);
  await Promise.all([
    access('docs/guide/getting-started.md'),
    access('docs/gates/catalog.md'),
    access('docs/adoption/existing-repository.md'),
    access('docs/decisions/native-git-hooks.md')
  ]);
});
