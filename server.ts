import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodemailer from 'nodemailer';
import { AppConfig, UptimeLog, CrawledLink } from './src/types';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, addDoc, query, orderBy, limit, writeBatch } from 'firebase/firestore';

dotenv.config();

// Initialize Firebase if configured
let db: any = null;
const JWT_SECRET = process.env.JWT_SECRET || 'uptime-monitor-fallback-secret-key-2024';

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
  blockedLinks: [],
  crawlEnabled: false,
  crawlDepth: 1,
};

let uptimeLogs: UptimeLog[] = [];
const MAX_LOGS = 1000;
const MAX_CRAWLED_LINKS = 5000;

let crawledLinksCache: CrawledLink[] = [];

const trimCrawledLinksCache = async () => {
  if (crawledLinksCache.length > MAX_CRAWLED_LINKS) {
    const mapped = crawledLinksCache.map((link, index) => ({ link, index }));
    mapped.sort((a, b) => {
      const aTime = a.link.lastChecked ? new Date(a.link.lastChecked).getTime() : 0;
      const bTime = b.link.lastChecked ? new Date(b.link.lastChecked).getTime() : 0;
      
      if (aTime > 0 && bTime > 0) return bTime - aTime;
      if (aTime === 0 && bTime === 0) return b.index - a.index;
      if (aTime === 0) return -1;
      return 1;
    });

    const toRemove = mapped.slice(MAX_CRAWLED_LINKS).map(m => m.link);
    crawledLinksCache = mapped.slice(0, MAX_CRAWLED_LINKS).map(m => m.link);

    if (db && toRemove.length > 0) {
       try {
         const batch = writeBatch(db);
         for (const link of toRemove) {
           batch.delete(doc(db, 'crawled_links', link.id));
         }
         await batch.commit();
       } catch (e) {
         console.error('Failed to clear old crawled links from DB:', e);
       }
    }
  }
};


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

    const linksQuery = query(collection(db, 'crawled_links'));
    const linksSnap = await getDocs(linksQuery);
    crawledLinksCache = linksSnap.docs.map(d => d.data() as CrawledLink);
    console.log(`Loaded ${crawledLinksCache.length} crawled links from DB`);
    await trimCrawledLinksCache();

    // Check for users and seed admin if none
    const usersSnap = await getDocs(query(collection(db, 'users'), limit(1)));
    if (usersSnap.empty) {
      const adminPasswordRaw = 'admin123';
      const passwordHash = await bcrypt.hash(adminPasswordRaw, 10);
      const adminUser = {
        id: crypto.randomUUID(),
        email: 'admin@example.com',
        passwordHash,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', adminUser.id), adminUser);
      console.log(`Seeded default admin user: admin@example.com / ${adminPasswordRaw}`);
    }

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

const persistCrawledLinkToDB = async (link: CrawledLink) => {
  if (!db) return;
  try {
    await setDoc(doc(db, 'crawled_links', link.id), link);
  } catch (err) {
    console.error('Failed to save crawled link to DB:', err);
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

// Link Crawler Logic
const extractText = (str: string) => str.replace(/<[^>]+>/g, '').trim().substring(0, 100);

const discoverLinks = async (targetUrl: string, parentUrl: string, html: string, depth: number) => {
  const aTagRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  
  const forbiddenPatterns = ['javascript:', 'mailto:', 'tel:', '#', 'data:', 'blob:'];

  while ((match = aTagRegex.exec(html)) !== null) {
    const rawHref = match[1];
    let linkText = extractText(match[2]);
    if (!linkText) linkText = 'Link';

    // Check forbidden
    if (forbiddenPatterns.some(p => rawHref.startsWith(p))) continue;

    try {
      const resolvedUrl = new URL(rawHref, targetUrl); // resolve relative to root target
      const fullHref = resolvedUrl.href;

      // Ensure same domain
      const targetDomain = new URL(targetUrl).hostname;
      if (resolvedUrl.hostname !== targetDomain) continue;

      const isDynamic = fullHref.includes('?') || fullHref.includes('#');

      const id = crypto.createHash('sha256').update(parentUrl + fullHref).digest('hex');

      // Check if exists
      const existing = crawledLinksCache.find(l => l.id === id);
      const isBlocked = appConfig.blockedLinks.some(blk => fullHref.includes(blk));

      if (existing) {
         if (existing.isBlocked !== isBlocked) {
            existing.isBlocked = isBlocked;
            await persistCrawledLinkToDB(existing);
         }
         continue;
      }

      if (crawledLinksCache.length >= MAX_CRAWLED_LINKS) {
        console.warn(`[Crawler] Max crawled links limit (${MAX_CRAWLED_LINKS}) reached. Skipping adding new links.`);
        break;
      }

      const newLink: CrawledLink = { 
        id,
        parentUrl,
        href: fullHref,
        linkText,
        isStatic: !isDynamic,
        isDynamic,
        isBlocked,
        lastStatus: 'pending',
        depth
      };

      crawledLinksCache.push(newLink);
      await trimCrawledLinksCache();
      await persistCrawledLinkToDB(newLink);
    } catch (e) {
      // Invalid URL syntax
    }
  }
};

const maskProxyUrl = (proxyUrl: string | null): string | null => {
  if (!proxyUrl) return null;
  return proxyUrl.replace(/:([^:@]+)@/, ':****@');
};

const processSubLinks = async (targetUrl: string, proxyAgent: any) => {
  // Find up to 10 links for this targetUrl that are pending or oldest checked, and NOT blocked
  const eligibleLinks = crawledLinksCache
    .filter(l => l.parentUrl === targetUrl && !l.isBlocked)
    .sort((a, b) => {
      if (a.lastStatus === 'pending' && b.lastStatus !== 'pending') return -1;
      if (a.lastStatus !== 'pending' && b.lastStatus === 'pending') return 1;
      if (!a.lastChecked) return -1;
      if (!b.lastChecked) return 1;
      return new Date(a.lastChecked).getTime() - new Date(b.lastChecked).getTime();
    })
    .slice(0, 10);

  for (const link of eligibleLinks) {
    const start = Date.now();
    try {
      const res = await axios.get(link.href, {
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent,
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 400
      });
      const responseTime = Date.now() - start;

      link.lastStatus = 'up';
      link.lastChecked = new Date().toISOString();
      link.responseTime = responseTime;

      const newLog: UptimeLog = {
        id: crypto.randomUUID(),
        url: link.href,
        status: 'up',
        timestamp: link.lastChecked,
        responseTime,
        proxyUsed: proxyAgent ? maskProxyUrl((proxyAgent as any).proxy?.href || 'Proxy') : null,
        isSubLink: true,
        parentUrl: targetUrl
      };
      
      uptimeLogs.unshift(newLog);
      await persistLogToDB(newLog);

      if (appConfig.crawlDepth >= 2 && link.depth < appConfig.crawlDepth) {
         if (typeof res.data === 'string') {
             await discoverLinks(targetUrl, targetUrl, res.data, link.depth + 1); 
         }
      }

    } catch (error: any) {
      const responseTime = Date.now() - start;
      const errorMsg = error.message || 'Unknown error';
      
      link.lastStatus = 'down';
      link.lastChecked = new Date().toISOString();
      link.responseTime = responseTime;

      const newErrLog: UptimeLog = {
        id: crypto.randomUUID(),
        url: link.href,
        status: 'down',
        timestamp: link.lastChecked,
        responseTime,
        proxyUsed: proxyAgent ? maskProxyUrl((proxyAgent as any).proxy?.href || 'Proxy') : null,
        errorDetails: errorMsg,
        isSubLink: true,
        parentUrl: targetUrl
      };

      uptimeLogs.unshift(newErrLog);
      await persistLogToDB(newErrLog);
      // specific requirement: Send email alert if a sub-link is down, include the crashed link URL in subject
      await sendEmailAlert(`Sub-link: ${link.href}`, `A sub-link crashed on your site:\nURL: ${link.href}\nFound on: ${targetUrl}\nError: ${errorMsg}`);
    }

    await persistCrawledLinkToDB(link);
    if (uptimeLogs.length > MAX_LOGS) {
      uptimeLogs = uptimeLogs.slice(0, MAX_LOGS);
    }
  }
};

const checkUrls = async () => {
  if (appConfig.urls.length === 0) return;

  for (const url of appConfig.urls) {
    let proxyUsed: string | null = null;
    let proxyAgent: HttpsProxyAgent<string> | undefined = undefined;

    // Pick a random proxy if available
    if (appConfig.proxies.length > 0) {
      const shuffledProxies = [...appConfig.proxies].sort(() => 0.5 - Math.random());
      
      for (const proxy of shuffledProxies) {
        try {
          const proxyUrlString = proxy.startsWith('http') ? proxy : `http://${proxy}`;
          new URL(proxyUrlString); // Validate URL parsing
          proxyAgent = new HttpsProxyAgent(proxyUrlString);
          proxyUsed = maskProxyUrl(proxy);
          break; // Successfully created, break out of loop
        } catch (err) {
          console.warn(`Invalid proxy format, skipping: ${proxy}`);
        }
      }
      
      if (!proxyAgent) {
        console.warn('All proxies invalid, falling back to direct connection.');
      }
    }

    const start = Date.now();
    let htmlContent: string | null = null;
    try {
      const res = await axios.get(url, {
        httpsAgent: proxyAgent,
        httpAgent: proxyAgent, // Handle proxy for http too if needed
        timeout: 10000,
        validateStatus: (status) => status >= 200 && status < 400
      });
      const responseTime = Date.now() - start;
      if (typeof res.data === 'string') htmlContent = res.data;

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

    if (appConfig.crawlEnabled) {
      if (htmlContent) {
        await discoverLinks(url, url, htmlContent, 1);
      }
      await processSubLinks(url, proxyAgent);
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
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  // Auth middleware
  const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  };

  // Auth Routes
  const authRouter = express.Router();
  
  authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQuery);
      let foundUser = null;
      for (const d of usersSnap.docs) {
        if (d.data().email === email) {
          foundUser = d.data();
          break;
        }
      }
      
      if (!foundUser) return res.status(401).json({ error: 'Invalid credentials' });
      
      const pwdMatch = await bcrypt.compare(password, foundUser.passwordHash);
      if (!pwdMatch) return res.status(401).json({ error: 'Invalid credentials' });
      
      const token = jwt.sign({ email: foundUser.email, id: foundUser.id }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, email: foundUser.email });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  authRouter.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQuery);
      let foundUser = null;
      for (const d of usersSnap.docs) {
        if (d.data().email === email) {
          foundUser = d.data();
          break;
        }
      }
      
      if (!foundUser) {
        // Return 200 even if not found to prevent email enumeration
        return res.json({ message: 'If an account exists, a reset link was sent.' });
      }
      
      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      const resetTokenExpiry = Date.now() + 3600000; // 1 hour
      
      foundUser.resetToken = resetToken;
      foundUser.resetTokenExpiry = resetTokenExpiry;
      await setDoc(doc(db, 'users', foundUser.id), foundUser);
      
      const transporter = getTransporter();
      if (transporter) {
        await transporter.sendMail({
          from: process.env.SMTP_USER || 'no-reply@uptimemonitor',
          to: email,
          subject: 'Your password reset code',
          text: `Your password reset code is: ${resetToken}\n\nIt expires in 1 hour.`
        });
      }
      
      res.json({ message: 'If an account exists, a reset link was sent.' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  authRouter.post('/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    if (!db) return res.status(500).json({ error: 'Database not initialized' });
    
    try {
      const usersQuery = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQuery);
      let foundUser = null;
      for (const d of usersSnap.docs) {
        if (d.data().email === email) {
          foundUser = d.data();
          break;
        }
      }
      
      if (!foundUser || foundUser.resetToken !== token || !foundUser.resetTokenExpiry || foundUser.resetTokenExpiry < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      foundUser.passwordHash = await bcrypt.hash(newPassword, 10);
      foundUser.resetToken = null;
      foundUser.resetTokenExpiry = null;
      
      await setDoc(doc(db, 'users', foundUser.id), foundUser);
      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  authRouter.get('/verify', requireAuth, (req, res) => {
    res.json({ valid: true, email: (req as any).user.email });
  });

  app.use('/api/auth', authRouter);

  // API Routes
  const apiRouter = express.Router();
  apiRouter.use(requireAuth);

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

  // Link Crawler APIs
  apiRouter.get('/crawled-links', (req, res) => {
    res.json(crawledLinksCache);
  });

  apiRouter.post('/crawled-links/block', async (req, res) => {
    const { href } = req.body;
    if (!href) return res.status(400).json({ error: 'href required' });

    if (!appConfig.blockedLinks.includes(href)) {
      appConfig.blockedLinks.push(href);
      await persistConfigToDB();
    }

    const linksToBlock = crawledLinksCache.filter(l => l.href.includes(href));
    for (const link of linksToBlock) {
      if (!link.isBlocked) {
        link.isBlocked = true;
        await persistCrawledLinkToDB(link);
      }
    }

    res.json({ message: 'Link blocked', blockedLinks: appConfig.blockedLinks });
  });

  apiRouter.post('/crawled-links/unblock', async (req, res) => {
    const { href } = req.body;
    if (!href) return res.status(400).json({ error: 'href required' });

    appConfig.blockedLinks = appConfig.blockedLinks.filter(b => b !== href);
    await persistConfigToDB();

    const linksToUnblock = crawledLinksCache.filter(l => l.href.includes(href));
    for (const link of linksToUnblock) {
      const isStillBlocked = appConfig.blockedLinks.some(blk => link.href.includes(blk));
      if (link.isBlocked && !isStillBlocked) {
        link.isBlocked = false;
        await persistCrawledLinkToDB(link);
      }
    }

    res.json({ message: 'Link unblocked', blockedLinks: appConfig.blockedLinks });
  });

  apiRouter.delete('/crawled-links/clear', async (req, res) => {
    if (db) {
      const batch = writeBatch(db);
      const snap = await getDocs(query(collection(db, 'crawled_links')));
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    crawledLinksCache = [];
    res.json({ message: 'Crawled links cleared' });
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
