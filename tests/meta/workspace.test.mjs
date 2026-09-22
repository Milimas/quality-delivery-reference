import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import assert from 'node:assert/strict';
import test from 'node:test';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

test('workspace pins package manager and exposes canonical quality commands', async () => {
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));

  assert.match(pkg.packageManager, /^pnpm@12\./);
  for (const name of ['format:check', 'lint', 'typecheck', 'test:unit']) {
    assert.equal(typeof pkg.scripts[name], 'string');
  }
});

test('development APIs publish loopback ports on a host-connected network', async () => {
  const { stdout } = await execFileAsync('docker', ['compose', 'config', '--format', 'json']);
  const compose = JSON.parse(stdout);

  assert.notEqual(compose.networks.platform.internal, true);
  assert.deepEqual(compose.services.orders.ports[0], {
    mode: 'ingress',
    host_ip: '127.0.0.1',
    target: 3000,
    published: '13000',
    protocol: 'tcp'
  });
  assert.deepEqual(compose.services.pricing.ports[0], {
    mode: 'ingress',
    host_ip: '127.0.0.1',
    target: 3001,
    published: '13001',
    protocol: 'tcp'
  });
});
