import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/verify-mac-release.mjs', import.meta.url));

test('macOS release rejects missing architectures, corrupted payloads and wrong versions', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logyourtime-mac-release-'));
  try {
    fs.mkdirSync(path.join(dir, 'release'));
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ version: '1.0.0' }));
    const files = [];
    for (const arch of ['x64', 'arm64']) {
      for (const ext of ['zip', 'dmg']) {
        const name = `LogYourTime-1.0.0-${arch}.${ext}`;
        const buffer = Buffer.from(`fixture-${arch}-${ext}`);
        fs.writeFileSync(path.join(dir, 'release', name), buffer);
        files.push({ url: name, size: buffer.length, sha512: crypto.createHash('sha512').update(buffer).digest('base64') });
      }
    }
    const metadataPath = path.join(dir, 'release/latest-mac.yml');
    const writeMetadata = (version = '1.0.0') => fs.writeFileSync(metadataPath, JSON.stringify({ version, files }));
    const verify = () => spawnSync(process.execPath, [script], { cwd: dir, encoding: 'utf8' });
    writeMetadata();
    assert.equal(verify().status, 0);
    writeMetadata('0.9.0');
    assert.notEqual(verify().status, 0);
    writeMetadata();
    const payloadPath = path.join(dir, 'release', files[0].url);
    const original = fs.readFileSync(payloadPath);
    fs.writeFileSync(payloadPath, 'corrupted');
    assert.notEqual(verify().status, 0);
    fs.writeFileSync(payloadPath, original);
    fs.unlinkSync(path.join(dir, 'release/LogYourTime-1.0.0-arm64.dmg'));
    assert.notEqual(verify().status, 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
