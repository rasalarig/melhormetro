#!/usr/bin/env node
/**
 * PropView Dev Server
 * Sempre mata o anterior, sempre inicia na mesma porta.
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3001;
const PID_FILE = path.join(__dirname, '.dev.pid');
const NEXT_DIR = path.join(__dirname, '.next');

function log(msg) {
  console.log(`\x1b[36m[propview]\x1b[0m ${msg}`);
}

// 1. Kill previous dev server (from our PID file)
if (fs.existsSync(PID_FILE)) {
  const oldPid = fs.readFileSync(PID_FILE, 'utf8').trim();
  if (oldPid) {
    log(`Matando servidor anterior (PID ${oldPid})...`);
    try {
      execSync(`taskkill /PID ${oldPid} /T /F`, { stdio: 'pipe' });
    } catch { /* already dead */ }
  }
  try { fs.unlinkSync(PID_FILE); } catch {}
}

// 2. Also kill anything else on our port
try {
  const output = execSync('netstat -ano', { encoding: 'utf8' });
  const pids = new Set();
  output.split('\n').forEach((line) => {
    const match = line.match(new RegExp(`:${PORT}\\s.*LISTENING\\s+(\\d+)`));
    if (match && match[1] !== '0') pids.add(match[1]);
  });
  pids.forEach((pid) => {
    log(`Matando processo na porta ${PORT} (PID ${pid})...`);
    try { execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'pipe' }); } catch {}
  });
} catch {}

// 3. Clean .next cache
if (fs.existsSync(NEXT_DIR)) {
  log('Limpando cache...');
  try {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
  } catch {
    try { execSync('npx rimraf .next', { cwd: __dirname, stdio: 'pipe', shell: true }); } catch {}
  }
}

// 4. Start dev server on fixed port
log('');
log(`>>> http://localhost:${PORT}`);
log('');

const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
const child = spawn(nextBin, ['dev', '-p', String(PORT)], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
});

// Save PID so next run can kill us
fs.writeFileSync(PID_FILE, String(child.pid));

child.on('exit', (code) => {
  try { fs.unlinkSync(PID_FILE); } catch {}
  process.exit(code || 0);
});

process.on('SIGINT', () => {
  child.kill();
  try { fs.unlinkSync(PID_FILE); } catch {}
  process.exit(0);
});
process.on('SIGTERM', () => {
  child.kill();
  try { fs.unlinkSync(PID_FILE); } catch {}
  process.exit(0);
});
