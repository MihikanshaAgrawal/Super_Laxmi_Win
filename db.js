const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("lottery.db");

db.run(`
CREATE TABLE IF NOT EXISTS results (
  slot_key TEXT PRIMARY KEY,
  number TEXT,
  is_locked INTEGER DEFAULT 0
)
`);

module.exports = db;