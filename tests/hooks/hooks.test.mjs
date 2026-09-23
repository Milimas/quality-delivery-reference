import { chmod, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
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

test('bootstrap removes the legacy hook path before installing pinned dependencies', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'quality-bootstrap-'));
  const repo = path.join(fixture, 'repo');
  const bin = path.join(fixture, 'bin');
  const eventLog = path.join(fixture, 'events.log');
  await mkdir(repo);
  await mkdir(bin);
  await executable(
    path.join(bin, 'git'),
    `case "$*" in
      "rev-parse --show-toplevel") printf '%s\\n' '${repo}' ;;
      *"config --get core.hooksPath") printf '%s\\n' '.githooks' ;;
      *"config --unset core.hooksPath") printf '%s\\n' 'unset legacy hooks' >>"$EVENT_LOG" ;;
    esac`
  );
  await executable(path.join(bin, 'docker'), 'exit 0');
  await executable(path.join(bin, 'make'), 'exit 0');
  await executable(path.join(bin, 'pnpm'), 'printf "pnpm %s\\n" "$*" >>"$EVENT_LOG"');

  const result = spawnSync('/bin/sh', [path.join(projectRoot, 'scripts/bootstrap')], {
    cwd: repo,
    encoding: 'utf8',
    env: { PATH: `${bin}:/bin`, EVENT_LOG: eventLog }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(
    await readFile(eventLog, 'utf8'),
    `unset legacy hooks\npnpm -C ${repo} install --frozen-lockfile\npnpm -C ${repo} exec lefthook install\n`
  );
});

test('Lefthook delegates commit and push hooks to the canonical Make gates', async () => {
  const fixture = await mkdtemp(path.join(tmpdir(), 'quality-lefthook-'));
  const bin = path.join(fixture, 'bin');
  const makeLog = path.join(fixture, 'make.log');
  await mkdir(bin);
  await executable(path.join(bin, 'make'), 'printf "%s\\n" "$*" >>"$MAKE_LOG"');

  for (const hook of ['pre-commit', 'pre-push']) {
    const result = spawnSync('pnpm', ['exec', 'lefthook', 'run', hook, '--force'], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, MAKE_LOG: makeLog }
    });
    assert.equal(result.status, 0, `${hook}: ${result.stdout}${result.stderr}`);
  }

  assert.equal(await readFile(makeLog, 'utf8'), 'check-fast\ncheck\n');
});

test('dependency setup can disable hook installation in Git-less containers', () => {
  const result = spawnSync('pnpm', ['run', 'prepare'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, LEFTHOOK: '0' }
  });

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(`${result.stdout}${result.stderr}`, /sync hooks/);
});
