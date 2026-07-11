// Secrets vault: API keys encrypted at rest with Windows DPAPI (CurrentUser
// scope) so the vault file is useless if copied to another machine/account.
// Secrets are piped via stdin — they never appear on a command line.
// Falls back to marked plaintext (still gitignored) if DPAPI is unavailable.
'use strict';
const fs = require('fs');
const { spawnSync } = require('child_process');
const { VAULT_PATH } = require('./paths');

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

/**
 * Load secrets: { providers: { openrouter: [{key, weight}], ... } }
 */
function loadSecrets() {
  let raw;
  try { raw = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8')); } catch { return { providers: {} }; }
  try {
    if (raw.dpapi) return JSON.parse(dpapiUnprotect(raw.payload));
    return raw.plaintext || { providers: {} };
  } catch (e) {
    console.error('[vault] Failed to decrypt secrets vault:', e.message);
    return { providers: {} };
  }
}

function saveSecrets(secrets) {
  const json = JSON.stringify(secrets);
  let out;
  try {
    out = { dpapi: true, updated: new Date().toISOString(), payload: dpapiProtect(json) };
  } catch (e) {
    console.error('[vault] DPAPI unavailable, storing plaintext (file is gitignored):', e.message);
    out = { dpapi: false, updated: new Date().toISOString(), plaintext: secrets };
  }
  const tmp = VAULT_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2));
  fs.renameSync(tmp, VAULT_PATH);
  return out.dpapi;
}

function vaultStatus() {
  try {
    const raw = JSON.parse(fs.readFileSync(VAULT_PATH, 'utf8'));
    return { exists: true, encrypted: !!raw.dpapi, updated: raw.updated || null };
  } catch { return { exists: false, encrypted: false, updated: null }; }
}

module.exports = { loadSecrets, saveSecrets, vaultStatus, dpapiProtect, dpapiUnprotect };
