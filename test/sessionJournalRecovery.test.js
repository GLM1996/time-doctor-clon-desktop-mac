import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openSessionJournal } from '../src/main/services/sessionJournalRecovery.js';

const record = { localId: 'local', ownerId: 'org:user', startTime: '2026-11-13T12:00:00Z', lastObservedAt: '2026-11-13T12:05:00Z' };
function fixture(t, content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lyt-journal-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const filePath = path.join(dir, 'session-events.json');
  fs.writeFileSync(filePath, content);
  const storage = {
    readJson: file => JSON.parse(fs.readFileSync(file, 'utf8')),
    writeJson: (file, value) => fs.writeFileSync(file, JSON.stringify(value)),
  };
  return { filePath, storage };
}

test('null-filled JSON is preserved byte for byte and new sessions can be recorded after restart', t => {
  const options = fixture(t, Buffer.alloc(64));
  let backup;
  const journal = openSessionJournal({ ...options, onRecovery: file => { backup = file; } });
  assert.deepEqual(fs.readFileSync(backup), Buffer.alloc(64));
  assert.deepEqual(journal.records, []);
  journal.start(record);
  const restored = openSessionJournal(options);
  assert.equal(restored.find(record.localId).endTime, record.startTime);
  assert.deepEqual(fs.readFileSync(backup), Buffer.alloc(64));
});

test('valid pending events retain their owner and close at their last durable observation', t => {
  const options = fixture(t, JSON.stringify([record]));
  const journal = openSessionJournal({ ...options, onRecovery: () => assert.fail('valid file quarantined') });
  assert.equal(journal.find(record.localId).ownerId, record.ownerId);
  assert.equal(journal.find(record.localId).endTime, record.lastObservedAt);
});

for (const message of ['EACCES', 'El cifrado seguro no esta disponible', 'Unsupported state or unable to authenticate data']) {
  test(`read failure stays blocking without quarantining: ${message}`, () => {
    const error = new Error(message);
    assert.throws(() => openSessionJournal({
      filePath: 'unused',
      storage: { readJson: () => { throw error; }, writeJson: () => assert.fail('overwritten') },
      quarantine: () => assert.fail('quarantined'),
    }), value => value === error);
  });
}

test('a failed quarantine never overwrites the damaged file', t => {
  const options = fixture(t, '\u0000');
  assert.throws(() => openSessionJournal({ ...options, quarantine: () => { throw new Error('EACCES'); } }), /EACCES/);
  assert.equal(fs.readFileSync(options.filePath, 'utf8'), '\u0000');
});

test('failure writing the new journal preserves the backup and blocks initialization', t => {
  const options = fixture(t, '\u0000');
  options.storage.writeJson = () => { throw new Error('disk full'); };
  let backup;
  assert.throws(() => openSessionJournal({ ...options, onRecovery: file => { backup = file; } }), /disk full/);
  assert.equal(fs.readFileSync(backup, 'utf8'), '\u0000');
});

test('structurally invalid JSON is not silently discarded', t => {
  const options = fixture(t, '{}');
  assert.throws(() => openSessionJournal(options), /Registro de sesiones inválido/);
  assert.equal(fs.readFileSync(options.filePath, 'utf8'), '{}');
});
