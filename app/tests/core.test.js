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

test('keypool: health scoring demotes failing keys', () => {
  const keys = [{ key: 'dddddddddd', weight: 1 }, { key: 'eeeeeeeeee', weight: 1 }];
  // key 0 fails a lot, key 1 succeeds a lot
  for (let i = 0; i < 8; i++) keypool.recordResult('test-health', 0, false, 500);
  for (let i = 0; i < 8; i++) keypool.recordResult('test-health', 1, true, 500);
  const lease = keypool.acquire('test-health', keys);
  assert.strictEqual(lease.index, 1, 'healthier key preferred');
  lease.release();
  const st = keypool.status('test-health', keys);
  assert.ok(st[0].healthPct < st[1].healthPct);
  assert.strictEqual(st[1].avgLatencyMs, 500);
});

test('agora: post/read roundtrip with identity, reply threading, and size caps', () => {
  const agora = require('../lib/agora');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'psq-agora-'));
  const id1 = agora.post(root, { author: 'TestBot', identity: 'test/model-1', type: 'proposal', title: 'T'.repeat(300), body: 'B'.repeat(5000) });
  const id2 = agora.post(root, { author: 'TestBot2', identity: 'test/model-2', type: 'critique', title: 'Disagree', body: 'Because reasons.', replyTo: id1 });
  const { exists, entries } = agora.read(root, 10);
  assert.ok(exists);
  assert.strictEqual(entries.length, 2);
  assert.strictEqual(entries[0].id, id1);
  assert.strictEqual(entries[0].identity, 'test/model-1');
  assert.ok(entries[0].title.length <= 120, 'title capped');
  assert.ok(entries[0].body.length <= 2000, 'body capped');
  assert.strictEqual(entries[1].replyTo, id1, 'reply threading preserved');
  assert.ok(agora.digest(root, 5).includes('Disagree'));
  fs.rmSync(root, { recursive: true, force: true });
});

test('vault: AES-256-GCM machine-key fallback roundtrips', () => {
  const { aesEncrypt, aesDecrypt, machineKey } = require('../lib/vault');
  const key = machineKey();
  const secret = JSON.stringify({ providers: { x: [{ key: 'sk-test-123', weight: 1 }] } });
  const enc = aesEncrypt(key, secret);
  assert.notStrictEqual(enc, secret);
  assert.ok(!enc.includes('sk-test-123'));
  assert.strictEqual(aesDecrypt(key, enc), secret);
});

test('sessions: save/load/list roundtrip', () => {
  const sessions = require('../lib/sessions');
  const sid = 'test-session-' + Date.now();
  sessions.save(sid, { history: [{ role: 'user', content: 'hi' }, { role: 'assistant', content: 'hello' }] });
  const loaded = sessions.load(sid);
  assert.strictEqual(loaded.history.length, 2);
  assert.ok(sessions.list().some(s => s.id === sid));
});

test('providers: normalizeForProvider fixes Mistral tool-role and Gemini empty-name 400s', () => {
  const { normalizeForProvider } = require('../lib/providers');
  // History as stored canonically by agent.js: assistant tool_call followed by
  // a named tool result — the shape sent to a fallback route (was the Mistral 400).
  const history = [
    { role: 'system', content: 'sys' },
    { role: 'assistant', content: '', tool_calls: [{ id: 't1', type: 'function', function: { name: 'view_file', arguments: '{}' } }] },
    { role: 'tool', tool_call_id: 't1', name: 'view_file', content: 'file body' },
    { role: 'user', content: 'thanks' }
  ];

  // noToolRole provider (Mistral): no 'tool' role may survive, and dangling
  // assistant tool_calls must be stripped.
  const mistral = normalizeForProvider(history, { noToolRole: true });
  assert.ok(!mistral.some(m => m.role === 'tool'), 'no tool role remains for noToolRole provider');
  assert.ok(mistral.some(m => m.role === 'user' && /Tool result for view_file/.test(m.content)), 'tool result folded into a user message with its name');
  assert.ok(!mistral.some(m => m.tool_calls), 'assistant tool_calls stripped');
  assert.ok(/Called tools: view_file/.test(mistral[1].content), 'called-tool context preserved on the assistant turn');

  // Standard OpenAI-compat provider (Gemini shim): tool role kept as-is.
  const gemini = normalizeForProvider(history, { noToolRole: false });
  assert.deepStrictEqual(gemini.find(m => m.role === 'tool').name, 'view_file', 'tool name preserved');

  // Gemini empty-name guard: a tool result with no name must never send "".
  const guarded = normalizeForProvider(
    [{ role: 'tool', tool_call_id: 't9', name: '', content: 'x' }],
    { noToolRole: false }
  );
  assert.ok(guarded[0].name && guarded[0].name.length > 0, 'empty function_response.name coerced to non-empty');

  // Non-mutating: the original history is left untouched for other routes.
  assert.strictEqual(history[1].tool_calls.length, 1, 'input array not mutated');
});

test('config: custom providers merge without overriding built-ins', () => {
  const { getProviders } = require('../lib/config');
  const merged = getProviders({ customProviders: {
    myprov: { label: 'Mine', endpoint: 'https://example.com/v1/chat/completions' },
    groq: { label: 'Evil override', endpoint: 'https://evil.example' }
  } });
  assert.strictEqual(merged.myprov.label, 'Mine');
  assert.ok(merged.myprov.custom);
  assert.notStrictEqual(merged.groq.endpoint, 'https://evil.example', 'built-ins cannot be overridden');
});
