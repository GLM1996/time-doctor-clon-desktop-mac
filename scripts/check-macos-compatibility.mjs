import { readdir, open } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Inspect the packaged files, not just the builder configuration or runner OS.
const maximum = '12.7.6';
const newer = value => {
  const parts = value.split('.').map(Number);
  const limit = maximum.split('.').map(Number);
  for (let i = 0; i < Math.max(parts.length, limit.length); i++) {
    if ((parts[i] || 0) !== (limit[i] || 0)) return (parts[i] || 0) > (limit[i] || 0);
  }
  return false;
};
const failures = [];
let binaries = 0;
const magic = new Set(['cffaedfe', 'cefaedfe', 'feedfacf', 'feedface', 'cafebabe', 'bebafeca', 'cafebabf', 'bfbafeca']);
async function inspect(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = path.join(folder, entry.name);
    if (entry.isSymbolicLink()) continue;
    if (entry.isDirectory()) { await inspect(file); continue; }
    if (!entry.isFile()) continue;
    if (entry.name === 'Info.plist') {
      const plist = JSON.parse(execFileSync('plutil', ['-convert', 'json', '-o', '-', file], { encoding: 'utf8' }));
      const requirements = [plist.LSMinimumSystemVersion, ...Object.values(plist.LSMinimumSystemVersionByArchitecture || {})].filter(Boolean);
      for (const version of requirements) {
        console.log(`${file}: macOS ${version}`);
        if (newer(version)) failures.push(`${file}: requires macOS ${version}`);
      }
    }
    const handle = await open(file, 'r');
    const bytes = Buffer.alloc(4);
    try { await handle.read(bytes, 0, 4, 0); } finally { await handle.close(); }
    if (!magic.has(bytes.toString('hex'))) continue;
    binaries++;
    const output = execFileSync('otool', ['-arch', 'all', '-l', file], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    const versions = [...output.matchAll(/cmd LC_BUILD_VERSION\b[\s\S]*?\bminos\s+(\d+(?:\.\d+)*)|cmd LC_VERSION_MIN_MACOSX\b[\s\S]*?\bversion\s+(\d+(?:\.\d+)*)/g)].map(match => match[1] || match[2]);
    if (!versions.length) failures.push(`${file}: no macOS deployment target found`);
    for (const version of versions) if (newer(version)) failures.push(`${file}: binary requires macOS ${version}`);
  }
}
if (process.platform !== 'darwin') throw new Error('This check requires macOS and Xcode command line tools.');
const root = path.resolve('release-mac');
const apps = [];
for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const folder = path.join(root, entry.name);
  for (const name of await readdir(folder)) if (name.endsWith('.app')) apps.push(path.join(folder, name));
}
if (!apps.length) throw new Error('No packaged .app found in release-mac.');
for (const app of apps) await inspect(app);
if (!binaries) throw new Error('No Mach-O binaries inspected.');
if (failures.length) throw new Error(`macOS ${maximum} compatibility check failed:\n${failures.join('\n')}`);
console.log(`Checked ${apps.length} app(s), ${binaries} Mach-O files: deployment requirements allow macOS ${maximum}. Functional testing on that OS is still required.`);
