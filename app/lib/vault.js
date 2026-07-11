// Secrets vault — cross-platform encryption at rest (Mistral suggestion #1).
//   win32:  Windows DPAPI (CurrentUser) — vault bound to this machine+account.
//   darwin: macOS Keychain via the `security` CLI (generic password item).
//   linux:  libsecret via `secret-tool` when available.
//   fallback: AES-256-GCM with a machine-derived scrypt key (better than
//             plaintext, weaker than an OS keystore — status reports honestly).
// Secrets are piped via stdin where possible — never on a command line.
// Backward compatible with the v2.0 vault format ({dpapi:true, payload}).
'use strict';
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { VAULT_PATH } = require('./paths');

/* ---------- Windows DPAPI ---------- */
const PS_PROTECT = `Add-Type -AssemblyName System.Security; $raw=[Console]::In.ReadToEnd().Trim(); $bytes=[Text.Encoding]::UTF8.GetBytes($raw); $enc=[Security.Cryptography.ProtectedData]::Protect($bytes,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($enc))`;
const PS_UNPROTECT = `Add-Type -AssemblyName System.Security; $b64=[Console]::In.ReadToEnd().Trim(); $enc=[Convert]::FromBase64String($b64); $bytes=[Security.Cryptography.ProtectedData]::Unprotect($enc,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Text.Encoding]::UTF8.GetString($bytes))`;

function runPs(script, input) {
  const res = spawnSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
    input, encoding: 'utf8', timeout: 30000, windowsHide: true
  });
  if (res.status !== 0 || res.error) throw new Error(`DPAPI call failed: ${res.stderr || res.error}`);
  return res.stdout.trim();
}
function dpapiProtect(plaintext) { return runPs(PS_PROTECT, plaintext); }
function dpapiUnprotect(b64) { return runPs(PS_UNPROTECT, b64); }

/* ---------- macOS Keychain (stores a random data key; payload AES-GCM) ---------- */
const KEYCHAIN_SERVICE = 'purple-squirrel-vault';
function keychainGetOrCreateKey() {
  let out = spawnSync('security', ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-w'], { encoding: 'utf8', timeout: 15000 });
  if (out.status === 0 && out.stdout.trim()) return Buffer.from(out.stdout.trim(), 'hex');
  const key = crypto.randomBytes(32);
  const add = spawnSync('security', ['add-generic-password', '-s', KEYCHAIN_SERVICE, '-a', os.userInfo().username, '-w', key.toString('hex'), '-U'], { encoding: 'utf8', timeout: 15000 });
  if (add.status !== 0) throw new Error('Keychain unavailable');
  return key;
}

/* ---------- Linux libsecret ---------- */
function secretToolGetOrCreateKey() {
  let out = spawnSync('secret-tool', ['lookup', 'service', KEYCHAIN_SERVICE], { encoding: 'utf8', timeout: 15000 });
  if (out.status === 0 && out.stdout.trim()) return Buffer.from(out.stdout.trim(), 'hex');
  const key = crypto.randomBytes(32);
  const add = spawnSync('secret-tool', ['store', '--label=Purple Squirrel Vault', 'service', KEYCHAIN_SERVICE], { input: key.toString('hex'), encoding: 'utf8', timeout: 15000 });
  if (add.status !== 0) throw new Error('secret-tool unavailable');
  return key;
}

/* ---------- AES-256-GCM helpers ---------- */
function aesEncrypt(key, plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}
function aesDecrypt(key, b64) {
  const buf = Buffer.from(b64, 'base64');
  const iv = buf.subarray(0, 12), tag = buf.subarray(12, 28), enc = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}
// Machine-derived key: deters casual copying, not a targeted local attacker.
function machineKey() {
  const seed = [os.hostname(), os.userInfo().username, os.platform(), os.arch(), os.homedir()].join('|');
  return crypto.scryptSync(seed, 'purple-squirrel-vault-v1', 32);
}

/* ---------- method dispatch ---------- */
function encryptorChain() {
  if (process.platform === 'win32') {
    return [
      { method: 'dpapi', enc: (t) => dpapiProtect(t), dec: (p) => dpapiUnprotect(p) },
      { method: 'aesgcm-machine', enc: (t) => aesEncrypt(machineKey(), t), dec: (p) => aesDecrypt(machineKey(), p) }
    ];
  }
  if (process.platform === 'darwin') {
    return [
      { method: 'keychain', enc: (t) => aesEncrypt(keychainGetOrCreateKey(), t), dec: (p) => aesDecrypt(keychainGetOrCreateKey(), p) },
      { method: 'aesgcm-machine', enc: (t) => aesEncrypt(machineKey(), t), dec: (p) => aesDecrypt(machineKey(), p) }
    ];
  }
  return [
    { method: 'libsecret', enc: (t) => aesEncrypt(secretToolGetOrCreateKey(), t), dec: (p) => aesDecrypt(secretToolGetOrCreateKey(), p) },
    { method: 'aesgcm-machine', enc: (t) => aesEncrypt(machineKey(), t), dec: (p) => aesDecrypt(machineKey(), p) }
  ];
}

const OS_METHODS = new Set(['dpapi', 'keychain', 'libsecret']);

/* ---------- public API ---------- */
function loadSecrets() {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8')); } catch { return { providers: {} }; }
  try {
    if (raw.dpapi) return JSON.parse(dpapiUnprotect(raw.payload)); // v2.0 legacy format
    if (raw.method === 'dpapi') return JSON.parse(dpapiUnprotect(raw.payload));
    if (raw.method === 'keychain') return JSON.parse(aesDecrypt(keychainGetOrCreateKey(), raw.payload));
    if (raw.method === 'libsecret') return JSON.parse(aesDecrypt(secretToolGetOrCreateKey(), raw.payload));
    if (raw.method === 'aesgcm-machine') return JSON.parse(aesDecrypt(machineKey(), raw.payload));
    return raw.plaintext || { providers: {} }; // legacy plaintext fallback
  } catch (e) {
    console.error('[vault] Failed to decrypt secrets vault:', e.message);
    return { providers: {} };
  }
}

function saveSecrets(secrets) {
  const json = JSON.stringify(secrets);
  let out = null;
  for (const { method, enc } of encryptorChain()) {
    try {
      out = { method, updated: new Date().toISOString(), payload: enc(json) };
      break;
    } catch (e) {
      console.error(`[vault] ${method} unavailable (${e.message}); trying next encryptor…`);
    }
  }
  if (!out) {
    console.error('[vault] All encryptors failed; storing plaintext (file is gitignored).');
    out = { method: 'plaintext', updated: new Date().toISOString(), plaintext: secrets };
  }
  const tmp = VAULT_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2));
  fs.renameSync(tmp, VAULT_PATH);
  return out.method !== 'plaintext';
}

function vaultStatus() {
  try {
    const raw = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
    const method = raw.dpapi ? 'dpapi' : (raw.method || 'plaintext');
    return {
      exists: true,
      method,
      encrypted: method !== 'plaintext',
      osBound: OS_METHODS.has(method),
      updated: raw.updated || null
    };
  } catch { return { exists: false, method: null, encrypted: false, osBound: false, updated: null }; }
}

module.exports = { loadSecrets, saveSecrets, vaultStatus, dpapiProtect, dpapiUnprotect, aesEncrypt, aesDecrypt, machineKey };
