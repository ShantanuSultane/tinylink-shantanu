/*
Simple DB wrapper using better-sqlite3 for local testing.
Tables:
- links(id, code, target_url, clicks, last_clicked, created_at)
This file is written so it's easy to replace with Postgres logic later.
Set DATABASE_URL to use Postgres in production and update this file accordingly.
*/

const Database = require('better-sqlite3');
const path = require('path');

const dbFile = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:') ?
  process.env.DATABASE_URL.replace('file:', '') :
  path.join(__dirname, 'data.sqlite');

const db = new Database(dbFile);

// initialize table
db.prepare(`CREATE TABLE IF NOT EXISTS links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  last_clicked TEXT,
  created_at TEXT DEFAULT (datetime('now'))
)`).run();

module.exports = {
  createLink(code, target_url) {
    const stmt = db.prepare('INSERT INTO links (code, target_url) VALUES (?, ?)');
    const info = stmt.run(code, target_url);
    return this.getLinkByCode(code);
  },
  getAllLinks() {
    return db.prepare('SELECT code, target_url, clicks, last_clicked, created_at FROM links ORDER BY created_at DESC').all();
  },
  getLinkByCode(code) {
    return db.prepare('SELECT code, target_url, clicks, last_clicked, created_at FROM links WHERE code = ?').get(code);
  },
  deleteLink(code) {
    return db.prepare('DELETE FROM links WHERE code = ?').run(code);
  },
  incrementClick(code) {
    const now = new Date().toISOString();
    db.prepare('UPDATE links SET clicks = clicks + 1, last_clicked = ? WHERE code = ?').run(now, code);
  }
};
