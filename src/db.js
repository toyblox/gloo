import Database from "@tauri-apps/plugin-sql";

let dbPromise = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:clipboard.db").then(async (db) => {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS snippets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          folder TEXT NOT NULL DEFAULT 'General',
          name TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL
        )
      `);
      return db;
    });
  }
  return dbPromise;
}

export async function getSnippets() {
  const db = await getDb();
  return db.select("SELECT * FROM snippets ORDER BY folder, name");
}

export async function saveSnippet({ id, folder, name, content }) {
  const db = await getDb();
  if (id) {
    await db.execute(
      "UPDATE snippets SET folder=?, name=?, content=? WHERE id=?",
      [folder, name, content, id]
    );
  } else {
    await db.execute(
      "INSERT INTO snippets (folder, name, content, created_at) VALUES (?, ?, ?, ?)",
      [folder, name, content, Date.now()]
    );
  }
}

export async function deleteSnippet(id) {
  const db = await getDb();
  await db.execute("DELETE FROM snippets WHERE id=?", [id]);
}
