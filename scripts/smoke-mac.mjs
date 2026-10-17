import process from 'node:process';
import { spawn } from 'node:child_process';
import electron from 'electron';
if (process.platform !== 'darwin') { console.error('Esta prueba requiere macOS.'); process.exit(1); }
const child = spawn(electron, ['.', '--mac-smoke-test'], { stdio: 'inherit', env: { ...process.env, ELECTRON_ENABLE_LOGGING: '1' } });
const timer = setTimeout(() => { child.kill('SIGKILL'); process.exitCode = 1; }, 45000);
child.on('error', error => { clearTimeout(timer); console.error(error); process.exitCode = 1; });
child.on('exit', code => { clearTimeout(timer); process.exitCode = code === 0 ? 0 : 1; });
