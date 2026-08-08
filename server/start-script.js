const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const services = [
  'api-gateway',
  'job',
  'job-worker',
  'notification',
  'notification-worker',
];

const args = process.argv.slice(2);
const production = args.includes('--prod') || process.env.NODE_ENV === 'production';
const watch = !production && !args.includes('--no-watch');
const debug = !production && args.includes('--debug');
const nestCommand = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
const children = new Map();
let shuttingDown = false;

function startService(service) {
  const command = production ? process.execPath : nestCommand;
  const commandArgs = production
    ? [path.join(__dirname, 'dist', 'apps', service, 'main.js')]
    : ['exec', 'nest', 'start', service];

  if (watch) commandArgs.push('--watch');
  if (debug) commandArgs.push('--debug');

  const child = spawn(command, commandArgs, {
    cwd: __dirname,
    env: process.env,
    shell: process.platform === 'win32' && !production,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  children.set(service, child);
  child.stdout.on('data', (data) => process.stdout.write(`[${service}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${service}] ${data}`));
  child.on('error', (error) => {
    console.error(`[${service}] failed to start: ${error.message}`);
    shutdown(1);
  });
  child.on('exit', (code, signal) => {
    children.delete(service);

    if (!shuttingDown) {
      if (code !== 0) {
        console.error(`[${service}] exited with ${signal ?? `code ${code}`}`);
      }
      shutdown(code ?? 1);
    }
  });
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children.values()) {
    child.kill('SIGTERM');
  }

  process.exitCode = code;
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

services.forEach(startService);
