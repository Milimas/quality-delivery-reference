import { chmod, cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '../..');

async function executable(file, contents) {
  await writeFile(file, `#!/bin/sh\n${contents}\n`);
  await chmod(file, 0o755);
}

test('bootstrap fails clearly before changing Git config when Docker is unavailable', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'quality-hooks-'));
  const bin = path.join(fixture, 'bin');
  await mkdir(bin);
  await executable(path.join(bin, 'git'), 'echo "$*" >>"$GIT_LOG"');

  const result = spawnSync('/bin/sh', [path.join(projectRoot, 'scripts/bootstrap')], {
    encoding: 'utf8',
    env: { PATH: bin, GIT_LOG: path.join(fixture, 'git.log') }
  });

  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /Docker with Compose is required/);
  await assert.rejects(readFile(path.join(fixture, 'git.log'), 'utf8'));
});

test('pre-commit resolves a checkout path containing spaces and delegates once', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'quality checkout '));
  const repo = path.join(fixture, 'repo with spaces');
  const nested = path.join(repo, 'nested');
  const bin = path.join(fixture, 'bin');
  await mkdir(path.join(repo, '.githooks'), { recursive: true });
  await mkdir(nested);
  await mkdir(bin);
  await cp(path.join(projectRoot, '.githooks/pre-commit'), path.join(repo, '.githooks/pre-commit'));
  await executable(path.join(bin, 'git'), `printf '%s\\n' '${repo}'`);
  await executable(path.join(bin, 'make'), 'printf "%s|%s\\n" "$PWD" "$*" >>"$MAKE_LOG"');

  const makeLog = path.join(fixture, 'make.log');
  const result = spawnSync('/bin/sh', [path.join(repo, '.githooks/pre-commit')], {
    cwd: nested,
    encoding: 'utf8',
    env: { PATH: `${bin}:/bin`, MAKE_LOG: makeLog }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(await readFile(makeLog, 'utf8'), `${repo}|check-fast\n`);
});
