import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodemailer from 'nodemailer';
import { AppConfig, UptimeLog } from './src/types';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, query, orderBy, limit, writeBatch } from 'firebase/firestore';

dotenv.config();

// Initialize Firebase if configured
let db: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const firebaseApp = initializeApp(firebaseConfig);
    db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
    console.log("Firebase initialized successfully with DB:", firebaseConfig.firestoreDatabaseId);
  }
} catch (err) {
  console.warn("Could not initialize Firebase:", err);
}

// Global App State (In-Memory for this architecture, backed by DB)
let appConfig: AppConfig = {
  urls: ['https://example.com'],
  proxies: [],
  email: '',
  intervalSeconds: 60,
};

let uptimeLogs: UptimeLog[] = [];
const MAX_LOGS = 1000;

// Database Persistence Helpers
const loadStateFromDB = async () => {
  if (!db) return;
  try {
    const configDoc = await getDoc(doc(db, 'config', 'main'));
    if (configDoc.exists()) {
      appConfig = { ...appConfig, ...configDoc.data() as AppConfig };
      console.log('Loaded config from DB');
    } else {
      // Seeder: Save default state if it doesn't exist
      await setDoc(doc(db, 'config', 'main'), appConfig);
      console.log('Seeded initial config to DB');
    }

    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'), limit(MAX_LOGS));
    const logsSnap = await getDocs(logsQuery);
    uptimeLogs = logsSnap.docs.map(d => d.data() as UptimeLog);
    console.log(`Loaded ${uptimeLogs.length} logs from DB`);
  } catch (err) {
    console.error('Failed to sync state with DB:', err);
  }
};

const persistConfigToDB = async () => {
  if (!db) return;
  try {
    await setDoc(doc(db, 'config', 'main'), appConfig);
  } catch (err) {
    console.error('Failed to save config to DB:', err);
  }
};

const persistLogToDB = async (log: UptimeLog) => {
  if (!db) return;
  try {
    await setDoc(doc(db, 'logs', log.id), log);
  } catch (err) {
    console.error('Failed to save log to DB:', err);
  }
};

const clearLogsInDB = async () => {
  if (!db) return;
  try {
    const logsQuery = query(collection(db, 'logs'), limit(MAX_LOGS));
    const logsSnap = await getDocs(logsQuery);
    const batch = writeBatch(db);
    logsSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear logs in DB:', err);
  }
};

// Email Transporter Setup 
const getTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT || '587'),
    secure: SMTP_PORT === '465',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendEmailAlert = async (url: string, errorMsg: string) => {
  if (!appConfig.email) return;
  const transporter = getTransporter();
  if (!transporter) {
    console.warn(`[Alert Mock] Alert email skipped due to missing SMTP environment variables. Would have sent alert to ${appConfig.email} for ${url}`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER || 'no-reply@uptimemonitor',
      to: appConfig.email,
      subject: `🚨 Alert: ${url} is Down`,
      text: `Your monitored site ${url} appears to be down.\n\nError details:\n${errorMsg}\n\nTime: ${new Date().toISOString()}`,
    });
    console.log(`Alert email sent to ${appConfig.email} for ${url}`);
  } catch (error) {
    console.error('Failed to send email alert:', error);
  }
};

// Monitoring Loop Logic
let monitorIntervalId: NodeJS.Timeout | null = null;

const checkUrls = async () => {
  if (appConfig.urls.length === 0) return;

  for (const url of appConfig.urls) {
    let proxyUsed: string | null = null;
    let proxyAgent: HttpsProxyAgent<string> | undefined = undefined;

    // Pick a random proxy if available
    if (appConfig.proxies.length > 0) {
      const randomIndex = Math.floor(Math.random() * appConfig.proxies.length);
      proxyUsed = appConfig.proxies[randomIndex];
      // Construct proxy agent
      try {
        // Only use agent if proxy is actually valid HTTP/HTTPS url
        const proxyUrlString = proxyUsed.startsWith('http') ? proxyUsed : `http://${proxyUsed}`;
        proxyAgent = new HttpsProxyAgent(proxyUrlString);
      } catch (err) {
        console.warn('Invalid proxy format, falling back to direct connection:', proxyUsed);
      }
    }

    const start = Date.now();
    try {
      await axios.get(url, {
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent, // Handle proxy for http too if needed
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 400
      });
      const responseTime = Date.now() - start;

      const newLog: UptimeLog = {
        id: crypto.randomUUID(),
        url,
        status: 'up',
        timestamp: new Date().toISOString(),
        responseTime,
        proxyUsed,
      };
      
      uptimeLogs.unshift(newLog);
      await persistLogToDB(newLog);

    } catch (error: any) {
      const responseTime = Date.now() - start;
      const errorMsg = error.message || 'Unknown error';
      
      const newErrLog: UptimeLog = {
        id: crypto.randomUUID(),
        url,
        status: 'down',
        timestamp: new Date().toISOString(),
        responseTime,
        proxyUsed,
        errorDetails: errorMsg,
      };

      uptimeLogs.unshift(newErrLog);
      await persistLogToDB(newErrLog);

      // Send alert
      await sendEmailAlert(url, errorMsg);
    }

    // Keep logs bound
    if (uptimeLogs.length > MAX_LOGS) {
      uptimeLogs = uptimeLogs.slice(0, MAX_LOGS);
    }
  }
};

const restartMonitoringLoop = () => {
  if (monitorIntervalId) {
    clearInterval(monitorIntervalId);
  }
  
  // Interval minimum is 10 seconds to prevent total spam
  const intervalMs = Math.max(10, appConfig.intervalSeconds) * 1000;
  
  monitorIntervalId = setInterval(() => {
    checkUrls().catch(err => console.error("Error in check loop:", err));
  }, intervalMs);

  // Immediately run once
  checkUrls().catch(err => console.error("Error in check loop:", err));
};

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json());

  // API Routes
  const apiRouter = express.Router();

  apiRouter.get('/config', (req, res) => {
    res.json(appConfig);
  });

  apiRouter.post('/config', async (req, res) => {
    const newConfig = req.body as AppConfig;
    let shouldRestart = false;

    if (newConfig.intervalSeconds !== appConfig.intervalSeconds || 
        JSON.stringify(newConfig.urls) !== JSON.stringify(appConfig.urls)) {
      shouldRestart = true;
    }

    appConfig = { ...appConfig, ...newConfig };
    await persistConfigToDB();
    
    if (shouldRestart) {
      restartMonitoringLoop();
    }
    
    res.json({ message: 'Configuration saved successfully', config: appConfig });
  });

  apiRouter.get('/logs', (req, res) => {
    res.json(uptimeLogs);
  });

  apiRouter.post('/logs/clear', async (req, res) => {
    uptimeLogs = [];
    await clearLogsInDB();
    res.json({ message: 'Logs cleared' });
  });

  app.use('/api', apiRouter);

  // Load state then start monitoring automatically on launch
  await loadStateFromDB();
  restartMonitoringLoop();

  // Vite Middleware Setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
