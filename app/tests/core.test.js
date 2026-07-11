// Eval-first rigor (Constitution Principle 2): core subsystem tests.
// Zero-dependency: node --test
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const keypool = require('../lib/keypool');
const { unifiedDiff, diffLines } = require('../lib/diff');
const { walk } = require('../lib/walker');
const policy = require('../lib/policy');
const { resolveInWorkspace } = require('../lib/tools');

test('keypool: weighted acquire prefers higher weight, respects cooldown', () => {
  const keys = [{ key: 'aaaaaaaaaa', weight: 1 }, { key: 'bbbbbbbbbb', weight: 5 }];
  const l1 = keypool.acquire('test-prov', keys);
  assert.strictEqual(l1.index, 1, 'higher-weight key selected first');
  keypool.cooldown('test-prov', 1, 60);
  const l2 = keypool.acquire('test-prov', keys);
  assert.strictEqual(l2.index, 0, 'cooled key skipped');
  l1.release(); l2.release();
  const status = keypool.status('test-prov', keys);
  assert.ok(status[1].cooled, 'status reports cooldown');
  assert.ok(status[1].resetInSec > 0 && status[1].resetInSec <= 60);
});

test('keypool: exhausted pool returns null', () => {
  const keys = [{ key: 'cccccccccc', weight: 1 }];
  keypool.cooldown('test-prov2', 0, 60);
  assert.strictEqual(keypool.acquire('test-prov2', keys), null);
});

test('diff: unified diff marks additions and deletions', () => {
  const d = unifiedDiff('x.txt', 'one\ntwo\nthree\n', 'one\nTWO\nthree\n');
  assert.match(d, /^--- a\/x\.txt/m);
  assert.match(d, /^-two$/m);
  assert.match(d, /^\+TWO$/m);
});

test('diff: identical inputs produce no changes', () => {
  assert.strictEqual(unifiedDiff('x.txt', 'same\n', 'same\n'), '(no changes)');
});

test('walker: prunes ignored directories and honors .gitignore', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'psq-walk-'));
  fs.mkdirSync(path.join(root, 'node_modules', 'x'), { recursive: true });
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'node_modules', 'x', 'big.js'), 'x');
  fs.writeFileSync(path.join(root, 'src', 'main.js'), 'x');
  fs.writeFileSync(path.join(root, 'secret.log'), 'x');
  fs.writeFileSync(path.join(root, '.gitignore'), '*.log\n');
  const entries = walk(root);
  const paths = entries.map(e => e.path);
  assert.ok(paths.includes('src/main.js'));
  assert.ok(!paths.some(p => p.includes('node_modules')), 'node_modules pruned');
  assert.ok(!paths.includes('secret.log'), '.gitignore honored');
  fs.rmSync(root, { recursive: true, force: true });
});

test('policy: Tier 3 destructive commands are blocked', () => {
  assert.strictEqual(policy.evaluateCommand('Remove-Item -Recurse -Force C:\\ ').tier, 'blocked');
  assert.strictEqual(policy.evaluateCommand('shutdown /s').tier, 'blocked');
  assert.strictEqual(policy.evaluateCommand('git push --force origin main').tier, 'blocked');
});

test('policy: Tier 1 ordinary commands are autonomous', () => {
  assert.strictEqual(policy.evaluateCommand('node --test tests/').tier, 'autonomous');
  assert.strictEqual(policy.evaluateCommand('git status').tier, 'autonomous');
});

test('policy: governance paths are protected', () => {
  assert.notStrictEqual(policy.evaluatePath('governance/AGENTS.policy.json').tier, 'autonomous');
  assert.notStrictEqual(policy.evaluatePath('.github/workflows/ci.yml').tier, 'autonomous');
  assert.strictEqual(policy.evaluatePath('src/index.js').tier, 'autonomous');
});

test('tools: workspace path escape is rejected', () => {
  assert.throws(() => resolveInWorkspace('C:\\some\\root', '..\\..\\Windows\\system32\\evil.txt'), /escapes workspace/);
  assert.ok(resolveInWorkspace('C:\\some\\root', 'sub\\file.txt').endsWith('file.txt'));
});
