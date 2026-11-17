import { SessionEventJournal } from './sessionEventJournal.js';
import { quarantineLocalPath } from './localDataRecovery.js';

export function openSessionJournal({ filePath, storage, quarantine = quarantineLocalPath, onRecovery = () => {} }) {
  let records;
  try {
    records = storage.readJson(filePath, []);
  } catch (error) {
    // Only malformed JSON is recoverable here. Permissions, unavailable keys and
    // authentication failures must never be mistaken for an empty journal.
    if (!(error instanceof SyntaxError)) throw error;
    const recoveryPath = quarantine(filePath);
    if (!recoveryPath) throw error;
    onRecovery(recoveryPath);
    storage.writeJson(filePath, []);
    records = [];
  }
  const journal = new SessionEventJournal({
    read: () => records,
    write: value => storage.writeJson(filePath, value),
  });
  if (journal.records.length) journal.recover();
  return journal;
}
