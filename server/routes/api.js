import express from 'express';
import multer from 'multer';
import QRCode from 'qrcode';
import Anthropic from '@anthropic-ai/sdk';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db/database.js';
import { auth } from '../middleware.js';

const router = express.Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });
router.use(auth);

const all = (sql, ...args) => db.prepare(sql).all(...args);
const get = (sql, ...args) => db.prepare(sql).get(...args);

router.get('/equipements', (req, res) => {
  const q = `%${req.query.q || ''}%`;
  res.json(all('SELECT * FROM equipements WHERE nom LIKE ? OR numero_serie LIKE ? OR localisation LIKE ? ORDER BY id DESC', q, q, q));
});
router.post('/equipements', (req, res) => {
  const e = req.body;
  if (!e.nom || e.nom.trim().length < 3) return res.status(400).json({ error: 'Nom equipement trop court' });
  if (!e.numero_serie) return res.status(400).json({ error: 'Numero de serie obligatoire' });
  if (!e.localisation) return res.status(400).json({ error: 'Localisation obligatoire' });
  const info = db.prepare('INSERT INTO equipements (nom,modele,numero_serie,fabricant,localisation,criticite,date_achat,statut) VALUES (?,?,?,?,?,?,?,?)')
    .run(e.nom, e.modele, e.numero_serie, e.fabricant, e.localisation, e.criticite || 'moyenne', e.date_achat, e.statut || 'actif');
  db.prepare('UPDATE equipements SET qr_code_url=? WHERE id=?').run(`/api/equipements/${info.lastInsertRowid}/qrcode`, info.lastInsertRowid);
  res.status(201).json(get('SELECT * FROM equipements WHERE id=?', info.lastInsertRowid));
});
router.get('/equipements/:id', (req, res) => {
  const equipement = get('SELECT * FROM equipements WHERE id=?', req.params.id);
  if (!equipement) return res.status(404).json({ error: 'Equipement introuvable' });
  equipement.pannes = all('SELECT p.*, u.prenom, u.nom FROM pannes p LEFT JOIN users u ON u.id=p.technicien_id WHERE equipement_id=? ORDER BY created_at DESC', req.params.id);
  res.json(equipement);
});
router.put('/equipements/:id', (req, res) => {
  const e = req.body;
  db.prepare('UPDATE equipements SET nom=?,modele=?,numero_serie=?,fabricant=?,localisation=?,criticite=?,date_achat=?,statut=? WHERE id=?')
    .run(e.nom, e.modele, e.numero_serie, e.fabricant, e.localisation, e.criticite, e.date_achat, e.statut, req.params.id);
  res.json(get('SELECT * FROM equipements WHERE id=?', req.params.id));
});
router.get('/equipements/:id/qrcode', async (req, res) => {
  const png = await QRCode.toBuffer(`equipement:${req.params.id}`);
  res.type('png').send(png);
});

router.get('/pannes', (req, res) => {
  const mine = req.query.mine === 'true' ? 'WHERE p.technicien_id=?' : '';
  const args = req.query.mine === 'true' ? [req.user.id] : [];
  res.json(all(`SELECT p.*, e.nom equipement_nom, e.localisation, u.prenom, u.nom FROM pannes p LEFT JOIN equipements e ON e.id=p.equipement_id LEFT JOIN users u ON u.id=p.technicien_id ${mine} ORDER BY p.created_at DESC`, ...args));
});
router.post('/pannes', (req, res) => {
  const p = req.body;
  if (!p.equipement_id) return res.status(400).json({ error: 'Equipement obligatoire' });
  if (!p.description || p.description.trim().length < 12) return res.status(400).json({ error: 'Description trop courte' });
  if (!['mineur', 'modere', 'urgent', 'critique'].includes(p.severite || 'modere')) return res.status(400).json({ error: 'Severite invalide' });
  const techId = p.technicien_id || req.user.id;
  const info = db.prepare('INSERT INTO pannes (equipement_id,technicien_id,description,severite,statut) VALUES (?,?,?,?,?)')
    .run(p.equipement_id, techId, p.description, p.severite || 'modere', 'en_attente');
  res.status(201).json(get('SELECT * FROM pannes WHERE id=?', info.lastInsertRowid));
});
router.get('/pannes/:id', (req, res) => {
  const panne = get('SELECT p.*, e.nom equipement_nom, e.numero_serie, e.localisation FROM pannes p LEFT JOIN equipements e ON e.id=p.equipement_id WHERE p.id=?', req.params.id);
  if (!panne) return res.status(404).json({ error: 'Panne introuvable' });
  panne.photos = all('SELECT * FROM photos WHERE panne_id=?', req.params.id);
  panne.etapes = all('SELECT * FROM workflow_etapes WHERE panne_id=? ORDER BY ordre', req.params.id);
  panne.pieces = all('SELECT * FROM demandes_pieces WHERE panne_id=? ORDER BY created_at DESC', req.params.id);
  panne.diagnostic = get('SELECT * FROM diagnostics_ia WHERE panne_id=? ORDER BY created_at DESC LIMIT 1', req.params.id);
  res.json(panne);
});
router.put('/pannes/:id/statut', (req, res) => {
  const closed = req.body.statut === 'clos' ? ', closed_at=CURRENT_TIMESTAMP' : '';
  db.prepare(`UPDATE pannes SET statut=? ${closed} WHERE id=?`).run(req.body.statut, req.params.id);
  res.json(get('SELECT * FROM pannes WHERE id=?', req.params.id));
});

router.post('/pannes/:id/photos', upload.array('photos', 4), (req, res) => {
  const rows = (req.files || []).map((file, index) => {
    const url = `/uploads/${file.filename}`;
    db.prepare('INSERT INTO photos (panne_id,url,annotation,mime_type) VALUES (?,?,?,?)').run(req.params.id, url, req.body.annotation || `Angle ${index + 1}`, file.mimetype);
    return { url, mime_type: file.mimetype };
  });
  res.status(201).json(rows);
});
router.get('/pannes/:id/photos', (req, res) => res.json(all('SELECT * FROM photos WHERE panne_id=?', req.params.id)));

router.get('/pannes/:id/etapes', (req, res) => res.json(all('SELECT * FROM workflow_etapes WHERE panne_id=? ORDER BY ordre', req.params.id)));
router.post('/pannes/:id/etapes', (req, res) => {
  const e = req.body;
  if (!e.titre || e.titre.trim().length < 3) return res.status(400).json({ error: 'Titre etape obligatoire' });
  if (!e.assignee_id) return res.status(400).json({ error: 'Technicien assigne obligatoire' });
  const info = db.prepare('INSERT INTO workflow_etapes (panne_id,titre,assignee_id,statut,ordre,deadline) VALUES (?,?,?,?,?,?)').run(req.params.id, e.titre, e.assignee_id, 'en_attente', e.ordre || 1, e.deadline);
  res.status(201).json(get('SELECT * FROM workflow_etapes WHERE id=?', info.lastInsertRowid));
});
router.put('/etapes/:id/statut', (req, res) => {
  const done = req.body.statut === 'termine' ? ', completed_at=CURRENT_TIMESTAMP' : '';
  db.prepare(`UPDATE workflow_etapes SET statut=? ${done} WHERE id=?`).run(req.body.statut, req.params.id);
  res.json(get('SELECT * FROM workflow_etapes WHERE id=?', req.params.id));
});

router.get('/pannes/:id/pieces', (req, res) => res.json(all('SELECT * FROM demandes_pieces WHERE panne_id=?', req.params.id)));
router.get('/pieces', (req, res) => res.json(all('SELECT dp.*, p.description, e.nom equipement_nom FROM demandes_pieces dp LEFT JOIN pannes p ON p.id=dp.panne_id LEFT JOIN equipements e ON e.id=p.equipement_id WHERE (? IS NULL OR dp.statut=?) ORDER BY dp.created_at DESC', req.query.statut || null, req.query.statut || null)));
router.post('/pannes/:id/pieces', (req, res) => {
  const p = req.body;
  if (!p.piece_nom || p.piece_nom.trim().length < 2) return res.status(400).json({ error: 'Nom de piece obligatoire' });
  if (Number(p.quantite || 1) < 1) return res.status(400).json({ error: 'Quantite invalide' });
  if (!['standard', 'urgent', 'critique'].includes(p.urgence || 'standard')) return res.status(400).json({ error: 'Urgence invalide' });
  const info = db.prepare('INSERT INTO demandes_pieces (panne_id,piece_nom,quantite,urgence,statut,commentaire) VALUES (?,?,?,?,?,?)').run(req.params.id, p.piece_nom, p.quantite || 1, p.urgence || 'standard', 'en_attente', p.commentaire);
  res.status(201).json(get('SELECT * FROM demandes_pieces WHERE id=?', info.lastInsertRowid));
});
router.put('/pieces/:id/statut', (req, res) => {
  db.prepare('UPDATE demandes_pieces SET statut=? WHERE id=?').run(req.body.statut, req.params.id);
  res.json(get('SELECT * FROM demandes_pieces WHERE id=?', req.params.id));
});

router.post('/pannes/:id/diagnostic', async (req, res) => {
  const panne = get('SELECT p.*, e.nom equipement_nom, e.modele, e.localisation, e.criticite FROM pannes p LEFT JOIN equipements e ON e.id=p.equipement_id WHERE p.id=?', req.params.id);
  const photos = all('SELECT * FROM photos WHERE panne_id=? ORDER BY id LIMIT 4', req.params.id);
  let resultat = {
    type_defaut_probable: 'Defaut mecanique probable',
    cause_possible: 'Analyse locale: vibration, temperature ou usure selon les symptomes fournis.',
    pieces_suggerees: ['Roulement industriel', 'Kit joints', 'Capteur de temperature']
  };
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'ta_cle_ici') {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const content = [
      {
        type: 'text',
        text: `Retourne uniquement un JSON avec les cles type_defaut_probable, cause_possible, pieces_suggerees.
Panne: ${panne?.description}
Severite: ${panne?.severite}
Machine: ${panne?.equipement_nom} ${panne?.modele || ''}
Localisation: ${panne?.localisation || ''}
Criticite: ${panne?.criticite || ''}`
      }
    ];
    for (const photo of photos) {
      const filePath = path.join(uploadsDir, path.basename(photo.url));
      if (fs.existsSync(filePath)) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: photo.mime_type || 'image/jpeg',
            data: fs.readFileSync(filePath).toString('base64')
          }
        });
      }
    }
    const msg = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 700,
      messages: [{ role: 'user', content }]
    });
    const text = msg.content?.[0]?.text || '';
    try {
      resultat = JSON.parse(text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim());
    } catch {
      resultat = { resultat_texte: text, pieces_suggerees: [] };
    }
  }
  db.prepare('INSERT INTO diagnostics_ia (panne_id,resultat_json) VALUES (?,?)').run(req.params.id, JSON.stringify(resultat));
  res.status(201).json(resultat);
});
router.get('/pannes/:id/diagnostic', (req, res) => {
  const row = get('SELECT * FROM diagnostics_ia WHERE panne_id=? ORDER BY created_at DESC LIMIT 1', req.params.id);
  res.json(row ? { ...row, resultat: JSON.parse(row.resultat_json) } : null);
});

router.get('/analytics/pannes-par-equipement', (req, res) => res.json(all('SELECT e.nom, COUNT(p.id) total FROM equipements e LEFT JOIN pannes p ON p.equipement_id=e.id GROUP BY e.id ORDER BY total DESC')));
router.get('/analytics/pieces-frequentes', (req, res) => res.json(all('SELECT piece_nom, SUM(quantite) total FROM demandes_pieces GROUP BY piece_nom ORDER BY total DESC')));
router.get('/analytics/tendances', (req, res) => res.json(all('SELECT date(created_at) jour, COUNT(*) total FROM pannes GROUP BY date(created_at) ORDER BY jour')));
router.get('/analytics/risques', (req, res) => res.json(all("SELECT e.nom, e.criticite, (COUNT(p.id) + 1) * CASE e.criticite WHEN 'critique' THEN 4 WHEN 'haute' THEN 3 WHEN 'moyenne' THEN 2 ELSE 1 END score FROM equipements e LEFT JOIN pannes p ON p.equipement_id=e.id GROUP BY e.id ORDER BY score DESC")));

router.get('/users', (req, res) => res.json(all('SELECT id,email,role,nom,prenom,created_at FROM users ORDER BY id')));
router.post('/users', (req, res) => {
  const u = req.body;
  const info = db.prepare('INSERT INTO users (email,password_hash,role,nom,prenom) VALUES (?,?,?,?,?)').run(u.email, bcrypt.hashSync(u.password || 'demo1234', 10), u.role, u.nom, u.prenom);
  res.status(201).json(get('SELECT id,email,role,nom,prenom FROM users WHERE id=?', info.lastInsertRowid));
});
router.put('/users/:id/role', (req, res) => {
  db.prepare('UPDATE users SET role=? WHERE id=?').run(req.body.role, req.params.id);
  res.json(get('SELECT id,email,role,nom,prenom FROM users WHERE id=?', req.params.id));
});

router.get('/export', (req, res) => {
  res.json({
    users: all('SELECT id,email,role,nom,prenom,created_at FROM users'),
    equipements: all('SELECT * FROM equipements'),
    pannes: all('SELECT * FROM pannes'),
    workflow_etapes: all('SELECT * FROM workflow_etapes'),
    demandes_pieces: all('SELECT * FROM demandes_pieces')
  });
});

export default router;
