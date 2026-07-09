import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const backendLogPath = path.join(projectRoot, 'backend.log');
const frontendLogPath = path.join(projectRoot, 'frontend.log');

const backendPort = 4000;
const frontendPort = 5175;

function isWindows() {
  return process.platform === 'win32';
}

async function isPortHealthy(port, healthPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const response = await fetch(`http://127.0.0.1:${port}${healthPath}`, { signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

function startDetached(command, args, logFile) {
  const out = fs.openSync(logFile, 'a');
  const child = spawn(command, args, {
    cwd: projectRoot,
    detached: true,
    stdio: ['ignore', out, out],
    windowsHide: true,
    shell: false,
  });
  child.unref();
  return child.pid;
}

async function main() {
  const backendAlive = await isPortHealthy(backendPort, '/api/health');
  const frontendAlive = await isPortHealthy(frontendPort, '/Face_Attendance_Portal-Project/');

  if (backendAlive) {
    console.log(`Backend already running on http://localhost:${backendPort}`);
  } else {
    const backendPid = startDetached(process.execPath, [path.join(projectRoot, 'server', 'index.js')], backendLogPath);
    console.log(`Started backend (pid ${backendPid}) on http://localhost:${backendPort}`);
  }

  if (frontendAlive) {
    console.log(`Frontend already running on http://localhost:${frontendPort}/Face_Attendance_Portal-Project/`);
  } else {
    const viteCli = path.join(projectRoot, 'node_modules', 'vite', 'bin', 'vite.js');
    const frontendPid = startDetached(
      process.execPath,
      [viteCli, '--host', '0.0.0.0', '--port', String(frontendPort), '--strictPort'],
      frontendLogPath
    );
    console.log(`Started frontend (pid ${frontendPid}) on http://localhost:${frontendPort}/Face_Attendance_Portal-Project/`);
  }

  console.log('Logs:');
  console.log(`- ${backendLogPath}`);
  console.log(`- ${frontendLogPath}`);
}

main().catch((error) => {
  console.error('Failed to start services:', error);
  process.exitCode = 1;
});
