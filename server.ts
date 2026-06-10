import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, query, limit, orderBy, deleteDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import { AppConfig, User, UptimeLog, CrawledLink } from './src/types';
import { startMonitoringLoop, getMonitorStatus } from './src/crawler';
import 'dotenv/config';

// Firebase init
let db: any;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.error("Firebase config not found. Disabling persistence.", e);
}

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-development';
const PORT = 3000;

export { db };

const app = express();
app.use(express.json());

// Auth middleware
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Seed initial config and admin user
async function seedDefaultData() {
  if (!db) return;
  try {
    const configDoc = await getDoc(doc(db, 'config', 'main'));
    if (!configDoc.exists()) {
      const defaultConfig: AppConfig = {
        urls: [],
        proxies: [],
        email: '',
        intervalSeconds: 60,
        crawlEnabled: false,
        crawlDepth: 1,
        blockedLinks: [],
        userAgent: '',
        viewportWidth: 1366,
        viewportHeight: 768
      };
      await setDoc(doc(db, 'config', 'main'), defaultConfig);
    }

    const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
    if (usersSnap.empty) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await setDoc(doc(db, 'users', 'admin'), {
        id: 'admin',
        email: 'admin@example.com',
        passwordHash
      });
      console.log('Seeded default admin user');
    }
  } catch (err: any) {
    console.error("Failed to seed Firebase data. Firebase rules might be blocking. Please set Firestore rules to allow your backend access.", err.message);
  }
}

// API Routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let foundUser: User | null = null;
    usersSnap.forEach(snap => {
      const u = snap.data() as User;
      if (u.email === email) foundUser = u;
    });

    if (!foundUser) return res.status(401).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, foundUser.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: foundUser.id, email: foundUser.email }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true });
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let foundUser: any = null;
    let userRef: any = null;
    usersSnap.forEach(d => {
      if (d.data().email === email) {
        foundUser = d.data();
        userRef = d.ref;
      }
    });

    if (foundUser && userRef) {
      const code = Math.random().toString().substring(2, 8); // 6 digits
      const expiry = Date.now() + 3600000;
      await setDoc(userRef, { resetCode: code, resetExpiry: expiry }, { merge: true });
      const { sendAlert } = await import('./src/mailer');
      await sendAlert(email, `Your password reset code is: ${code}`, 'System', 'Password Reset');
    }
    res.json({ success: true, message: 'If email exists, check your inbox.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    let foundUser: any = null;
    let userRef: any = null;
    usersSnap.forEach(d => {
      if (d.data().email === email) {
        foundUser = d.data();
        userRef = d.ref;
      }
    });

    if (!foundUser || foundUser.resetCode !== code || Date.now() > (foundUser.resetExpiry || 0)) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await setDoc(userRef, { passwordHash, resetCode: null, resetExpiry: null }, { merge: true });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/config', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  const snap = await getDoc(doc(db, 'config', 'main'));
  res.json(snap.data());
});

app.post('/api/config', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  await setDoc(doc(db, 'config', 'main'), req.body);
  res.json({ success: true });
  // Restart crawler loop is handled inside startMonitoringLoop when config changes
});

app.get('/api/logs', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  const snap = await getDocs(query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(500)));
  const logs = snap.docs.map(d => d.data());
  res.json(logs);
});

app.post('/api/logs/clear', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  const snap = await getDocs(collection(db, 'logs'));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  res.json({ success: true });
});

app.get('/api/crawled-links', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  const snap = await getDocs(collection(db, 'crawled_links'));
  res.json(snap.docs.map(d => d.data()));
});

app.post('/api/crawled-links/block', authenticateToken, async (req, res) => {
  // Simple update block status
  const { href } = req.body;
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  
  // Find link by href
  const snap = await getDocs(collection(db, 'crawled_links'));
  const batch = writeBatch(db);
  snap.forEach(d => {
    if (d.data().href === href) {
      batch.update(d.ref, { isBlocked: true });
    }
  });
  await batch.commit();
  res.json({ success: true });
});

app.post('/api/crawled-links/unblock', authenticateToken, async (req, res) => {
  const { href } = req.body;
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  
  const snap = await getDocs(collection(db, 'crawled_links'));
  const batch = writeBatch(db);
  snap.forEach(d => {
    if (d.data().href === href) {
      batch.update(d.ref, { isBlocked: false });
    }
  });
  await batch.commit();
  res.json({ success: true });
});

app.delete('/api/crawled-links/clear', authenticateToken, async (req, res) => {
  if (!db) return res.status(500).json({ error: 'DB not initialized' });
  const snap = await getDocs(collection(db, 'crawled_links'));
  const batch = writeBatch(db);
  snap.forEach(d => batch.delete(d.ref));
  await batch.commit();
  res.json({ success: true });
});

app.get('/api/status', authenticateToken, (req, res) => {
  res.json(getMonitorStatus());
});

async function startServer() {
  await seedDefaultData();
  startMonitoringLoop();

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
