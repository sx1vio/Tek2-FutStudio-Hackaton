import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.js';

const router = express.Router();
const sign = (user) => jwt.sign({ id: user.id, role: user.role, email: user.email }, process.env.JWT_SECRET || 'hackathon_secret_key', { expiresIn: '8h' });

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) return res.status(401).json({ error: 'Identifiants invalides' });
  res.json({ token: sign(user), user: { id: user.id, email: user.email, role: user.role, nom: user.nom, prenom: user.prenom } });
});

router.post('/register', (req, res) => {
  const { email, password, role = 'technicien', nom, prenom } = req.body;
  const hash = bcrypt.hashSync(password || 'demo1234', 10);
  try {
    const info = db.prepare('INSERT INTO users (email,password_hash,role,nom,prenom) VALUES (?,?,?,?,?)').run(email, hash, role, nom, prenom);
    const user = db.prepare('SELECT id,email,role,nom,prenom FROM users WHERE id=?').get(info.lastInsertRowid);
    res.status(201).json({ token: sign(user), user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
