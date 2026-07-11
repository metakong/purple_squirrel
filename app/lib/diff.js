// Minimal line-based diff (LCS) producing unified-diff-style hunks for the
// review UI. Pure JS, no dependencies.
'use strict';

function diffLines(oldText, newText) {
  const a = oldText.split('\n');
  const b = newText.split('\n');
  const n = a.length, m = b.length;
  // Myers-ish LCS via DP with a cap for very large files.
  if (n * m > 4_000_000) {
    return [{ type: 'replace', oldStart: 1, oldLines: a, newStart: 1, newLines: b }];
  }
  const dp = new Uint32Array((n + 1) * (m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * (m + 1) + j] = a[i] === b[j]
        ? dp[(i + 1) * (m + 1) + j + 1] + 1
        : Math.max(dp[(i + 1) * (m + 1) + j], dp[i * (m + 1) + j + 1]);
    }
  }
  const ops = []; // {t:' '|'-'|'+', line}
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push({ t: ' ', line: a[i] }); i++; j++; }
    else if (dp[(i + 1) * (m + 1) + j] >= dp[i * (m + 1) + j + 1]) { ops.push({ t: '-', line: a[i] }); i++; }
    else { ops.push({ t: '+', line: b[j] }); j++; }
  }
  while (i < n) ops.push({ t: '-', line: a[i++] });
  while (j < m) ops.push({ t: '+', line: b[j++] });
  return ops;
}

// Render ops into unified diff text with 3 lines of context.
function unifiedDiff(filePath, oldText, newText) {
  const ops = diffLines(oldText, newText);
  if (ops.length && ops[0].type === 'replace') {
    // fallback whole-file replacement
    const o = ops[0];
    return `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,${o.oldLines.length} +1,${o.newLines.length} @@\n` +
      o.oldLines.map(l => '-' + l).join('\n') + '\n' + o.newLines.map(l => '+' + l).join('\n');
  }
  const lines = [`--- a/${filePath}`, `+++ b/${filePath}`];
  let oldLn = 1, newLn = 1;
  let hunk = null;
  const flush = () => {
    if (!hunk) return;
    // trim trailing context beyond 3
    while (hunk.body.length && hunk.body[hunk.body.length - 1].t === ' ' && hunk.trailCtx > 3) {
      hunk.body.pop(); hunk.trailCtx--; hunk.oldCount--; hunk.newCount--;
    }
    lines.push(`@@ -${hunk.oldStart},${hunk.oldCount} +${hunk.newStart},${hunk.newCount} @@`);
    for (const o of hunk.body) lines.push(o.t + o.line);
    hunk = null;
  };
  let ctxBuf = [];
  for (const op of ops) {
    if (op.t === ' ') {
      if (hunk) {
        hunk.body.push(op); hunk.oldCount++; hunk.newCount++; hunk.trailCtx++;
        if (hunk.trailCtx > 6) flush();
      } else {
        ctxBuf.push({ op, oldLn, newLn });
        if (ctxBuf.length > 3) ctxBuf.shift();
      }
      oldLn++; newLn++;
    } else {
      if (!hunk) {
        const lead = ctxBuf;
        hunk = {
          oldStart: lead.length ? lead[0].oldLn : oldLn,
          newStart: lead.length ? lead[0].newLn : newLn,
          oldCount: lead.length, newCount: lead.length,
          body: lead.map(x => x.op), trailCtx: 0
        };
        ctxBuf = [];
      }
      hunk.trailCtx = 0;
      hunk.body.push(op);
      if (op.t === '-') { hunk.oldCount++; oldLn++; } else { hunk.newCount++; newLn++; }
    }
  }
  flush();
  return lines.length > 2 ? lines.join('\n') : '(no changes)';
}

module.exports = { unifiedDiff, diffLines };
