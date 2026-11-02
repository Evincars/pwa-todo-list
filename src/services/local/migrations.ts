/**
 * Synchronous, idempotent upgrades of documents persisted by older app versions.
 * Only relevant for the localStorage backend – Firestore data starts on the current schema.
 */

type LegacyDoc = Record<string, unknown>;

interface Migration {
  /** Matches document paths (without the namespace prefix). */
  path: RegExp;
  migrate: (doc: LegacyDoc) => LegacyDoc | null;
}

const renameField = (from: string, to: string) => (doc: LegacyDoc) => {
  if (!(from in doc) || to in doc) return null;
  const { [from]: value, ...rest } = doc;
  return { ...rest, [to]: value };
};

const MIGRATIONS: Migration[] = [
  // v0.1 → v0.2: list icons can be glyphs too, `emoji` became `icon`.
  { path: /^lists\/[^/]+$/, migrate: renameField('emoji', 'icon') },
  { path: /^invitations\/[^/]+$/, migrate: renameField('listEmoji', 'listIcon') },
];

export const migrateLocalData = (storage: Storage, namespace: string) => {
  const prefix = `${namespace}:`;
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith(prefix)) continue;
    const path = key.slice(prefix.length);
    const migrations = MIGRATIONS.filter((migration) => migration.path.test(path));
    if (!migrations.length) continue;
    try {
      let doc = JSON.parse(storage.getItem(key) ?? 'null') as LegacyDoc | null;
      let changed = false;
      for (const migration of migrations) {
        const next = doc && migration.migrate(doc);
        if (next) {
          doc = next;
          changed = true;
        }
      }
      if (changed) storage.setItem(key, JSON.stringify(doc));
    } catch {
      // Corrupted entries are ignored by the store anyway.
    }
  }
};
