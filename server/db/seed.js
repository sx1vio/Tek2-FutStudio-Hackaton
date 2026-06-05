import bcrypt from 'bcryptjs';
import db, { initDb } from './database.js';

initDb();

const tables = ['diagnostics_ia', 'demandes_pieces', 'workflow_etapes', 'photos', 'pannes', 'equipements', 'users'];
for (const table of tables) db.prepare(`DELETE FROM ${table}`).run();
db.prepare('DELETE FROM sqlite_sequence').run();

const password = bcrypt.hashSync('demo1234', 10);
const users = [
  ['tech@demo.local', password, 'technicien', 'Miller', 'Jordan'],
  ['manager@demo.local', password, 'manager', 'Chen', 'Marcus'],
  ['admin@demo.local', password, 'admin', 'Diallo', 'Awa']
];
for (const user of users) {
  db.prepare('INSERT INTO users (email,password_hash,role,nom,prenom) VALUES (?,?,?,?,?)').run(...user);
}

const equipements = [
  ['CNC Mill X-2', 'X-2', 'CNC-2049', 'Mazak', 'North Depot', 'critique', '2023-01-12', 'actif'],
  ['Hydraulic Pump RX-900', 'RX-900', 'PMP-900', 'Bosch Rexroth', 'Sector 7G', 'critique', '2022-06-04', 'arret'],
  ['Laser Cutter L-1022', 'L-1022', 'LAS-1022', 'Trumpf', 'Sector 3B', 'haute', '2021-09-18', 'actif'],
  ['Compressor A-17', 'A-17', 'CMP-017', 'Atlas Copco', 'South Bay', 'moyenne', '2020-11-02', 'maintenance'],
  ['Conveyor CV-44', 'CV-44', 'CNV-044', 'Siemens', 'Line 4', 'faible', '2024-03-20', 'actif']
];
for (const e of equipements) {
  const info = db.prepare('INSERT INTO equipements (nom,modele,numero_serie,fabricant,localisation,criticite,date_achat,statut) VALUES (?,?,?,?,?,?,?,?)').run(...e);
  db.prepare('UPDATE equipements SET qr_code_url=? WHERE id=?').run(`/api/equipements/${info.lastInsertRowid}/qrcode`, info.lastInsertRowid);
}

const pannes = [
  [2, 1, 'Temperature critique et vibration anormale sur pompe hydraulique.', 'critique', 'en_cours'],
  [3, 1, 'Calibration capteur requise apres derive de mesure.', 'modere', 'en_attente'],
  [1, 1, 'Bruit intermittent sur axe Y.', 'urgent', 'en_attente']
];
for (const panne of pannes) {
  const info = db.prepare('INSERT INTO pannes (equipement_id,technicien_id,description,severite,statut) VALUES (?,?,?,?,?)').run(...panne);
  db.prepare("INSERT INTO workflow_etapes (panne_id,titre,assignee_id,statut,ordre,deadline) VALUES (?,?,?,?,?,datetime('now','+4 hours'))").run(info.lastInsertRowid, 'Inspection visuelle', 1, 'en_attente', 1);
  db.prepare('INSERT INTO demandes_pieces (panne_id,piece_nom,quantite,urgence,statut,commentaire) VALUES (?,?,?,?,?,?)').run(info.lastInsertRowid, 'Kit joints haute pression', 1, 'urgent', 'en_attente', 'Suggestion IA demo');
  db.prepare('INSERT INTO diagnostics_ia (panne_id,resultat_json) VALUES (?,?)').run(info.lastInsertRowid, JSON.stringify({
    type_defaut_probable: 'Surchauffe mecanique',
    cause_possible: 'Usure de roulement ou lubrification insuffisante',
    pieces_suggerees: ['Roulement industriel', 'Kit joints haute pression']
  }));
}

console.log('Base de demo creee. Comptes: tech@demo.local / manager@demo.local / admin@demo.local, mot de passe demo1234');
