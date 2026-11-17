import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// js-yaml is supplied by electron-builder, which is required to build a release.
const require = createRequire(import.meta.url);
const { load } = require('js-yaml');
const version = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
const root = path.resolve('release');
const metadata = load(fs.readFileSync(path.join(root, 'latest-mac.yml'), 'utf8'));
if (metadata.version !== version) throw new Error('La versión de latest-mac.yml no coincide.');
for (const arch of ['x64', 'arm64']) {
  for (const ext of ['dmg', 'zip']) {
    const name = `LogYourTime-${version}-${arch}.${ext}`;
    const buffer = fs.readFileSync(path.join(root, name));
    const entry = metadata.files?.find(file => file.url === name);
    const digest = crypto.createHash('sha512').update(buffer).digest('base64');
    if (!buffer.length || !entry || entry.size !== buffer.length || entry.sha512 !== digest) {
      throw new Error(`Artefacto o metadatos inválidos: ${name}`);
    }
  }
}
for (const entry of metadata.files || []) {
  if (typeof entry.url !== 'string' || path.basename(entry.url) !== entry.url) {
    throw new Error('Ruta de actualización inválida.');
  }
  if (!fs.existsSync(path.join(root, entry.url))) throw new Error(`Falta ${entry.url}`);
}
console.log(`Release macOS ${version} verificado para Intel y Apple Silicon.`);
