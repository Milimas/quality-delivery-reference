import { chmod, mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import assert from 'node:assert/strict';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '../..');

test('secret scanner rejects a known credential outside the allowlist', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'secret-fixture-'));
  await writeFile(
    path.join(fixture, 'credentials.env'),
    `GITHUB_TOKEN=ghp_${randomBytes(32).toString('base64url').slice(0, 36)}\n`
  );

  const result = spawnSync(
    '/bin/sh',
    [path.join(projectRoot, 'scripts/quality/security'), fixture],
    {
      encoding: 'utf8'
    }
  );
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /leaks found: 1/i);
});

test('image build records immutable sha256 evidence for both services', async () => {
  const fakeBin = await mkdtemp(path.join(tmpdir(), 'digest-fixture-'));
  const docker = path.join(fakeBin, 'docker');
  await writeFile(
    docker,
    '#!/bin/sh\nif [ "$1" = compose ]; then exit 0; fi\nprintf "sha256:%064d\\n" 1\n'
  );
  await chmod(docker, 0o755);
  await mkdir(path.join(projectRoot, 'artifacts'), { recursive: true });

  const result = spawnSync('/bin/sh', [path.join(projectRoot, 'scripts/quality/build-images')], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, PATH: `${fakeBin}:/bin` }
  });
  assert.equal(result.status, 0, result.stderr);
  const evidence = await readFile(path.join(projectRoot, 'artifacts/image-digests.txt'), 'utf8');
  assert.match(evidence, /^orders@sha256:[0-9]{64}$/m);
  assert.match(evidence, /^pricing@sha256:[0-9]{64}$/m);
});
