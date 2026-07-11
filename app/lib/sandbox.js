// WSL execution backend — an optional, opt-in alternative to running agent
// shell commands directly on the Windows host. Uses ONLY Node's child_process
// against the native `wsl.exe` (zero dependencies). Commands run in the default
// WSL distribution's bash.
//
// HONESTY ABOUT THE BOUNDARY (Constitution Principle 1 — Radical Transparency):
// this is process/userland separation, NOT a strong security jail. By default
// WSL automounts the Windows drives under /mnt, so a command here can still
// reach the Windows filesystem. It gives you a Linux userland and a separate
// process/env namespace, and is the foundation for stronger isolation later
// (a dedicated distro with automount disabled, or `--cd` into a confined path).
// Do not describe it to users as a security sandbox without that caveat.
//
// Graceful degradation: if `wsl.exe` is absent, or no distribution is installed
// and runnable, isAvailable() returns false and runInSandbox() returns a clean
// "unavailable" result so the caller can fall back to host execution.
'use strict';
const { spawn, spawnSync } = require('child_process');

const PROBE_TIMEOUT_MS = 15000;
const MAX_STDOUT = 60000;
const MAX_STDERR = 20000;

let _availableCache = null; // null = not yet probed

/**
 * True only when wsl.exe exists AND a distribution actually executes a command.
 * Probed once per process (WSL's first cold-start can take a few seconds) and
 * cached. Always false off Windows.
 */
function isAvailable() {
  if (_availableCache !== null) return _availableCache;
  if (process.platform !== 'win32') { _availableCache = false; return _availableCache; }
  try {
    const res = spawnSync('wsl.exe', ['-e', 'bash', '-lc', 'exit 0'], {
      timeout: PROBE_TIMEOUT_MS, windowsHide: true
    });
    // status 0 means a distro ran bash successfully. ENOENT (no wsl.exe) or a
    // non-zero status ("no installed distributions") both mean unavailable.
    _availableCache = !res.error && res.status === 0;
  } catch {
    _availableCache = false;
  }
  return _availableCache;
}

/** Reset the availability cache (e.g. after the user installs a distro). */
function resetAvailability() { _availableCache = null; }

function unavailableMessage() {
  return 'SANDBOX UNAVAILABLE: WSL with an installed, runnable Linux distribution was not found on this host. '
    + 'Isolated execution is disabled. Install one with `wsl --install` (a one-time step that requires admin and '
    + 'creates a Linux user account), then re-enable the sandbox in Settings.';
}

/** Shape a result string consistent with the host PowerShell executor in tools.js. */
function formatResult(code, out, err) {
  return `Exit code: ${code}\nSTDOUT:\n${(out || '').slice(0, 30000) || '(empty)'}\nSTDERR:\n${(err || '').slice(0, 10000) || '(empty)'}`;
}

// Translate a Windows path (C:\a\b) to its default WSL mount (/mnt/c/a/b).
// Assumes the standard automount root; a custom root just means the command
// runs from $HOME instead of the workspace.
function toWslPath(winPath) {
  if (!winPath) return null;
  const m = /^([A-Za-z]):\/(.*)$/.exec(String(winPath).replace(/\\/g, '/'));
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2]}` : null;
}
function shQuote(s) { return `'${String(s).replace(/'/g, `'\\''`)}'`; }

/**
 * Run a command in the WSL distro's bash. Non-interactive (no -it).
 * @param {string} command  shell command (bash) to execute
 * @param {object} opts  { cwd, timeoutMs, _isAvailable }  (_isAvailable is a test seam)
 * @returns {Promise<{available:boolean, code:number|null, stdout:string, stderr:string, text:string}>}
 */
function runInSandbox(command, opts = {}) {
  const { cwd, timeoutMs = 120000, _isAvailable = isAvailable } = opts;
  return new Promise((resolve) => {
    if (!_isAvailable()) {
      return resolve({ available: false, code: null, stdout: '', stderr: '', text: unavailableMessage() });
    }
    // Do NOT pass spawn's `cwd` for wsl.exe — on Windows a custom working dir
    // makes the WSL launcher fail with ENOENT. Translate the workspace path and
    // `cd` into it inside bash instead.
    const wslCwd = toWslPath(cwd);
    const full = wslCwd ? `cd ${shQuote(wslCwd)} && ${command}` : command;
    const child = spawn('wsl.exe', ['-e', 'bash', '-lc', full], { windowsHide: true });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill(); out += `\n[TIMEOUT after ${Math.round(timeoutMs / 1000)}s]`; }, timeoutMs);
    child.stdout.on('data', d => { if (out.length < MAX_STDOUT) out += d; });
    child.stderr.on('data', d => { if (err.length < MAX_STDERR) err += d; });
    child.on('close', code => {
      clearTimeout(timer);
      resolve({ available: true, code, stdout: out, stderr: err, text: formatResult(code, out, err) });
    });
    child.on('error', e => {
      clearTimeout(timer);
      resolve({ available: true, code: null, stdout: '', stderr: String(e.message), text: `Failed to spawn WSL: ${e.message}` });
    });
  });
}

module.exports = { isAvailable, resetAvailability, runInSandbox, formatResult, unavailableMessage, toWslPath };
