import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db/database.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

initDb();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`API demarree sur http://localhost:${port}`));
