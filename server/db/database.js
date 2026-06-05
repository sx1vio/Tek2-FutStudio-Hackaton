import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '../../database.db'));
db.pragma('foreign_keys = ON');

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('technicien', 'manager', 'admin')) NOT NULL,
      nom TEXT,
      prenom TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS equipements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nom TEXT NOT NULL,
      modele TEXT,
      numero_serie TEXT UNIQUE,
      fabricant TEXT,
      localisation TEXT,
      criticite TEXT CHECK(criticite IN ('faible', 'moyenne', 'haute', 'critique')),
      date_achat DATE,
      statut TEXT DEFAULT 'actif',
      qr_code_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS pannes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipement_id INTEGER REFERENCES equipements(id),
      technicien_id INTEGER REFERENCES users(id),
      description TEXT,
      severite TEXT CHECK(severite IN ('mineur', 'modere', 'urgent', 'critique')),
      statut TEXT DEFAULT 'en_attente',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panne_id INTEGER REFERENCES pannes(id),
      url TEXT NOT NULL,
      annotation TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS workflow_etapes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panne_id INTEGER REFERENCES pannes(id),
      titre TEXT NOT NULL,
      assignee_id INTEGER REFERENCES users(id),
      statut TEXT DEFAULT 'en_attente',
      ordre INTEGER,
      deadline DATETIME,
      completed_at DATETIME
    );
    CREATE TABLE IF NOT EXISTS demandes_pieces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panne_id INTEGER REFERENCES pannes(id),
      piece_nom TEXT NOT NULL,
      quantite INTEGER DEFAULT 1,
      urgence TEXT CHECK(urgence IN ('standard', 'urgent', 'critique')),
      statut TEXT DEFAULT 'en_attente',
      commentaire TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS diagnostics_ia (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      panne_id INTEGER REFERENCES pannes(id),
      resultat_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  const photoColumns = db.prepare('PRAGMA table_info(photos)').all().map((column) => column.name);
  if (!photoColumns.includes('mime_type')) {
    db.prepare('ALTER TABLE photos ADD COLUMN mime_type TEXT').run();
  }
}

export default db;
