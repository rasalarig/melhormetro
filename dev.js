#!/usr/bin/env node
/**
 * PropView Dev Server — startup script
 * Mata processos zumbis, limpa cache, encontra porta livre, inicia limpo.
 * Uso: node dev.js
 */
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const net = require('net');

const NEXT_DIR = path.join(__dirname, '.next');

function log(msg) {
  console.log(`\x1b[36m[propview]\x1b[0m ${msg}`);
}

// Kill processes on a specific port
function killPort(port) {
  try {
    const output = execSync('netstat -ano', { encoding: 'utf8' });
    const pids = new Set();
    output.split('\n').forEach((line) => {
      const regex = new RegExp(`:${port}\\s.*LISTENING\\s+(\\d+)`);
      const match = line.match(regex);
      if (match && match[1] !== '0') pids.add(match[1]);
    });
    pids.forEach((pid) => {
      try {
        execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'pipe' });
        log(`  Processo ${pid} finalizado.`);
      } catch { /* access denied — skip */ }
    });
  } catch { /* ok */ }
}

// Check if port is free
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => { server.close(); resolve(true); });
    server.listen(port);
  });
}

// Find a free port starting from base
async function findFreePort(base) {
  for (let p = base; p < base + 20; p++) {
    if (await isPortFree(p)) return p;
  }
  throw new Error('Nenhuma porta livre entre 3000-3020');
}

async function main() {
  // 1. Try to kill processes on preferred ports
  log('Matando processos antigos...');
  for (let p = 3000; p <= 3005; p++) killPort(p);

  // Small delay for port release
  await new Promise((r) => setTimeout(r, 1000));

  // 2. Clean .next cache
  if (fs.existsSync(NEXT_DIR)) {
    log('Limpando cache .next...');
    try {
      fs.rmSync(NEXT_DIR, { recursive: true, force: true, maxRetries: 5, retryDelay: 1000 });
      log('Cache limpo.');
    } catch {
      log('.next travado, tentando rimraf...');
      try {
        execSync('npx rimraf .next', { cwd: __dirname, stdio: 'inherit', shell: true });
      } catch {
        log('AVISO: .next não pôde ser limpo. Continuando...');
      }
    }
  } else {
    log('Cache .next limpo.');
  }

  // 3. Find free port
  const port = await findFreePort(3000);
  if (port !== 3000) {
    log(`Porta 3000 ocupada (processo travado). Usando porta ${port}.`);
  }

  // 4. Start
  log('');
  log(`>>> Acesse: http://localhost:${port}`);
  log('');

  const nextBin = path.join(__dirname, 'node_modules', '.bin', 'next');
  const child = spawn(nextBin, ['dev', '-p', String(port)], {
    stdio: 'inherit',
    shell: true,
    cwd: __dirname,
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=512' },
  });

  child.on('exit', (code) => process.exit(code || 0));
  process.on('SIGINT', () => { child.kill(); process.exit(0); });
  process.on('SIGTERM', () => { child.kill(); process.exit(0); });
}

main().catch((err) => { console.error(err); process.exit(1); });
