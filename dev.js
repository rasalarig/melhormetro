#!/usr/bin/env node
/**
 * PropView Dev Server — startup script
 * Limpa cache corrompido e inicia o dev server de forma estável.
 * Uso: node dev.js
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const NEXT_DIR = path.join(__dirname, '.next');

function log(msg) {
  console.log(`\x1b[36m[propview]\x1b[0m ${msg}`);
}

// 1. Kill any existing Next.js dev server on port 3000
log('Parando processos antigos na porta 3000...');
try {
  if (process.platform === 'win32') {
    execSync('netstat -ano | findstr :3000 | findstr LISTENING', { stdio: 'pipe' })
      .toString()
      .split('\n')
      .filter(Boolean)
      .forEach((line) => {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && pid !== '0') {
          try { execSync(`taskkill /PID ${pid} /F`, { stdio: 'pipe' }); } catch {}
        }
      });
  } else {
    execSync('lsof -ti:3000 | xargs kill -9 2>/dev/null || true', { stdio: 'pipe' });
  }
} catch {
  // No process on port 3000 — ok
}

// 2. Clean .next cache
if (fs.existsSync(NEXT_DIR)) {
  log('Limpando cache .next...');
  try {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
    log('Cache limpo.');
  } catch (err) {
    log(`Aviso: não conseguiu limpar .next completamente: ${err.message}`);
    log('Tentando com rimraf...');
    try {
      execSync('npx rimraf .next', { stdio: 'inherit' });
    } catch {
      log('Aviso: rimraf também falhou. Continuando mesmo assim...');
    }
  }
} else {
  log('Cache .next não existe — tudo limpo.');
}

// 3. Start dev server
log('Iniciando dev server...');
log('');

const child = spawn('npx', ['next', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname,
  env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

// Forward signals
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
