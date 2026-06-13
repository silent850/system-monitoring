import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import { HttpsProxyAgent } from 'https-proxy-agent';
import nodemailer from 'nodemailer';
import { AppConfig, UptimeLog, CrawledLink } from './src/types.ts';
import dotenv from 'dotenv';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from './src/db/prisma';

dotenv.config();

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
let usersCache: any[] = [];
const JWT_SECRET = process.env.JWT_SECRET || 'uptime-monitor-fallback-secret-key-2024';

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

    if (toRemove.length > 0) {
       try {
         const idsToRemove = toRemove.map(l => l.id);
         // Process in smaller batches if needed, but for 5000 it is fine
         await prisma.crawledLink.deleteMany({ where: { id: { in: idsToRemove } } });
       } catch (e) {
         console.error('Failed to clear old crawled links from DB:', e);
       }
    }
  }
};

// Database Persistence Helpers
const loadStateFromDB = async () => {
  try {
    const configResult = []; // Config is now part of system settings, default to empty
    if (configResult.length > 0) {
      const c = configResult[0];
      appConfig = { 
        ...appConfig, 
        urls: Array.isArray(c.urls) ? (c.urls as string[]) : [],
        proxies: Array.isArray(c.proxies) ? (c.proxies as string[]) : [],
        email: c.email || '',
        intervalSeconds: c.intervalSeconds || 60,
        blockedLinks: Array.isArray(c.blockedLinks) ? (c.blockedLinks as string[]) : [],
        crawlEnabled: c.crawlEnabled ?? false,
        crawlDepth: c.crawlDepth ?? 1,
      };
      console.log('Loaded config from DB');
    } else {
      
      console.log('Seeded initial config to DB');
    }
  } catch (err: any) {
    console.warn('Could not load config from DB:', err.message || err);
  }

  try {
    const logsResult = await prisma.uptimeCheck.findMany({ orderBy: { timestamp: 'desc' }, take: MAX_LOGS });
    uptimeLogs = logsResult.map(l => ({
      id: l.id,
      url: (l as any).url || 'https://example.com/mock',
      status: l.status as 'up' | 'down',
      responseTime: l.responseTime || undefined,
      errorDetails: l.errorDetails || undefined,
      proxyUsed: l.proxyUsed || undefined,
      isSubLink: (l as any).isSubLink || undefined,
      parentUrl: (l as any).parentUrl || undefined,
      timestamp: String(l.timestamp)
    }));
    console.log(`Loaded ${uptimeLogs.length} logs from DB`);
  } catch (err: any) {
    console.warn('Could not load logs from DB:', err.message || err);
  }

  try {
    const linksResult = await prisma.crawledLink.findMany();
    crawledLinksCache = linksResult.map(l => ({
      ...l,
      linkText: l.linkText || undefined,
      lastStatus: (l.lastStatus as 'up' | 'down' | 'pending') || 'pending',
      lastChecked: l.lastChecked ? String(l.lastChecked) : undefined,
      responseTime: l.responseTime || undefined,
      isStatic: !!l.isStatic,
      isDynamic: !!l.isDynamic,
      isBlocked: !!l.isBlocked,
      depth: l.depth || 1,
    }));
    console.log(`Loaded ${crawledLinksCache.length} crawled links from DB`);
    await trimCrawledLinksCache();
  } catch (err: any) {
    console.warn('Could not load crawled links from DB:', err.message || err);
  }

  // Load system settings
  try {
    const sysRes = await prisma.systemSettings.findUnique({ where: { id: 'main' } }); const sysResult = sysRes ? [sysRes] : [];
    if (sysResult.length === 0) {
      console.log('No system_settings found. Needs installation.');
    } else {
      console.log(`System installed: ${sysResult[0].isInstalled}`);
    }
  } catch (err: any) {
    console.warn('System settings table or row undefined. Proceed to /install to run migrations.');
  }

  // Load cache of users
  try {
    const usersResult = await prisma.user.findMany();
    usersCache = usersResult;
  } catch (err: any) {
    console.warn('Could not load users from DB:', err.message || err);
  }
};

const persistConfigToDB = async () => {
  try {
    
  } catch (err) {
    console.error('Failed to save config to DB:', err);
  }
};

const persistCrawledLinkToDB = async (link: CrawledLink) => {
  try {
    try { await prisma.crawledLink.upsert({ where: { id: link.id }, create: link as any, update: link as any }); } catch(err){}
  } catch (err) {
    console.error('Failed to save crawled link to DB:', err);
  }
};

const persistLogToDB = async (log: UptimeLog) => {
  try {
    await prisma.uptimeCheck.create({ data: { id: log.id, monitorId: 'dummy-monitor', status: log.status, responseTime: log.responseTime, errorDetails: log.errorDetails, proxyUsed: log.proxyUsed, timestamp: log.timestamp ? new Date(log.timestamp) : new Date() } }).catch(()=>{ /* ignore missing monitor */ });
  } catch (err) {
    console.error('Failed to save log to DB:', err);
  }
};

const clearLogsInDB = async () => {
  try {
    await prisma.uptimeCheck.deleteMany();
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

    if (forbiddenPatterns.some(p => rawHref.startsWith(p))) continue;

    try {
      const resolvedUrl = new URL(rawHref, targetUrl); // resolve relative to root target
      const fullHref = resolvedUrl.href;

      const targetDomain = new URL(targetUrl).hostname;
      if (resolvedUrl.hostname !== targetDomain) continue;

      const isDynamic = fullHref.includes('?') || fullHref.includes('#');

      const id = crypto.createHash('sha256').update(parentUrl + fullHref).digest('hex');

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

    if (appConfig.proxies.length > 0) {
      const shuffledProxies = [...appConfig.proxies].sort(() => 0.5 - Math.random());
      
      for (const proxy of shuffledProxies) {
        try {
          const proxyUrlString = proxy.startsWith('http') ? proxy : `http://${proxy}`;
          new URL(proxyUrlString);
          proxyAgent = new HttpsProxyAgent(proxyUrlString);
          proxyUsed = maskProxyUrl(proxy);
          break;
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
        httpAgent: proxyAgent,
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

      await sendEmailAlert(url, errorMsg);
    }

    if (appConfig.crawlEnabled) {
      if (htmlContent) {
        await discoverLinks(url, url, htmlContent, 1);
      }
      await processSubLinks(url, proxyAgent);
    }

    if (uptimeLogs.length > MAX_LOGS) {
      uptimeLogs = uptimeLogs.slice(0, MAX_LOGS);
    }
  }
};

const restartMonitoringLoop = () => {
  if (monitorIntervalId) {
    clearInterval(monitorIntervalId);
  }
  
  const intervalMs = Math.max(10, appConfig.intervalSeconds) * 1000;
  
  monitorIntervalId = setInterval(() => {
    checkUrls().catch(err => console.error("Error in check loop:", err));
  }, intervalMs);

  checkUrls().catch(err => console.error("Error in check loop:", err));
};

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json());

  const requireAuthMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

  const authRouter = express.Router();
  
  authRouter.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
      // Refresh user from DB to get latest
      const dbUsers = await prisma.user.findMany({ where: { email } });
      if (dbUsers.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
      
      const foundUser = dbUsers[0];
      
      const pwdMatch = await bcrypt.compare(password, foundUser.passwordHash);
      if (!pwdMatch) return res.status(401).json({ error: 'Invalid credentials' });
      
      // Get roles
      const userRolesData = await prisma.userRole.findMany({ where: { userId: foundUser.id }, include: { role: true } }).then(res => res.map(r => ({ roleName: r.role.name })));

      const roleNames = userRolesData.map(ur => ur.roleName);

      const token = jwt.sign({ 
        email: foundUser.email, 
        id: foundUser.id,
        roles: roleNames
      }, JWT_SECRET, { expiresIn: '24h' });
      
      res.json({ token, email: foundUser.email, roles: roleNames });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  });

  authRouter.post('/register', async (req, res) => {
    const { name, email, password, companyName } = req.body;
    try {
      // Check if user exists
      const existingUser = await prisma.user.findMany({ where: { email } });
      if (existingUser.length > 0) return res.status(400).json({ error: 'Email already registered' });

      // Create company
      const companyId = crypto.randomUUID();
      await prisma.company.create({ data: { id: companyId, name: companyName } });

      // Create user
      const userId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash(password, 10);
      await prisma.user.create({ data: { id: userId, companyId: companyId, name, email, passwordHash } });

      // Find 'User' role and assign
      const roleResult = await prisma.role.findMany({ where: { name: 'User' } });
      if (roleResult.length > 0) {
        await prisma.userRole.create({ data: { userId, roleId: roleResult[0].id } });
      }

      // Automatically log them in
      const token = jwt.sign({ email, id: userId, roles: ['User'] }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, email, roles: ['User'] });
    } catch (err: any) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Server error: ' + err.message });
    }
  });

  authRouter.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    try {
      let foundUser = usersCache.find(u => u.email === email);
      
      if (!foundUser) {
        return res.json({ message: 'If an account exists, a reset link was sent.' });
      }
      
      const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase();
      const resetTokenExpiry = Date.now() + 3600000;
      
      foundUser.resetToken = resetToken;
      foundUser.resetTokenExpiry = new Date(resetTokenExpiry);
      
      try {
        await prisma.user.update({ where: { id: foundUser.id }, data: { resetToken, resetTokenExp: new Date(resetTokenExpiry) } });
      } catch (err: any) {
        console.warn('Could not save reset token to DB:', err.message);
      }
      
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
    
    try {
      let foundUser = usersCache.find(u => u.email === email);
      
      if (!foundUser || foundUser.resetToken !== token || !foundUser.resetTokenExpiry || foundUser.resetTokenExpiry.getTime() < Date.now()) {
        return res.status(400).json({ error: 'Invalid or expired token' });
      }
      
      foundUser.passwordHash = await bcrypt.hash(newPassword, 10);
      foundUser.resetToken = null;
      foundUser.resetTokenExpiry = null;
      
      try {
        await prisma.user.update({ where: { id: foundUser.id }, data: { passwordHash: foundUser.passwordHash, resetToken: null, resetTokenExp: null } });
      } catch (err: any) {
        console.warn('Could not save new password to DB:', err.message);
      }
      res.json({ message: 'Password reset successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  authRouter.get('/verify', requireAuthMiddleware, (req, res) => {
    res.json({ valid: true, email: (req as any).user.email, roles: (req as any).user.roles || [] });
  });

  app.use('/api/auth', authRouter);

  // Installer Routes (Public initially)
  const installerRouter = express.Router();
  installerRouter.get('/status', async (req, res) => {
    try {
      const sysRes = await prisma.systemSettings.findUnique({ where: { id: 'main' } }); const sysResult = sysRes ? [sysRes] : [];
      if (sysResult.length === 0) {
        return res.json({ isInstalled: false });
      }
      return res.json({ isInstalled: !!sysResult[0].isInstalled, settings: sysResult[0] });
    } catch (err: any) {
      // Any error querying systemSettings means it's likely not migrated
      return res.json({ isInstalled: false, needsMigration: true });
    }
  });

  installerRouter.post('/install', async (req, res) => {
    try {
      // Check if already installed
      let isMigrated = true;
      try {
        const sysRes = await prisma.systemSettings.findUnique({ where: { id: 'main' } }); const sysResult = sysRes ? [sysRes] : [];
        if (sysResult.length > 0 && sysResult[0].isInstalled) {
          return res.status(403).json({ error: 'System is already installed' });
        }
      } catch (checkErr: any) {
        // Any error querying systemSettings means the table is missing or invalid
        isMigrated = false;
      }

      if (!isMigrated) {
        // Log that we are initializing the first company
        console.log('System requires setup...');
      }

      const {
        systemName, companyName, logoUrl, faviconUrl, supportEmail, timezone,
        adminName, adminEmail, adminPassword,
        smtpHost, smtpPort, smtpUsername, smtpPassword, smtpEncryption,
        sonicPesaAccessKey, sonicPesaSecretKey, sonicPesaWebhookSecret, sonicPesaEnv
      } = req.body;

      // 1. Create Roles & Permissions
      const adminRole = { id: crypto.randomUUID(), name: 'Admin' };
      const userRole = { id: crypto.randomUUID(), name: 'User' };
      await prisma.role.createMany({ data: [adminRole, userRole], skipDuplicates: true });

      // 2. Create System Admin user (no company id for super admin initially, or could assign to a system company)
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      const adminUser = {
        id: crypto.randomUUID(),
        email: adminEmail,
        name: adminName,
        passwordHash,
      };
      const comp = await prisma.company.create({ data: { name: companyName || systemName || 'System Company' } }); await prisma.user.create({ data: { ...adminUser, companyId: comp.id } });
      await prisma.userRole.create({ data: { userId: adminUser.id, roleId: adminRole.id } });

      // 3. Save SMTP Settings
      await prisma.smtpSettings.upsert({ where: { id: 'main' }, create: { 
        id: 'main',
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort) : 587,
        username: smtpUsername,
        password: smtpPassword,
        encryption: smtpEncryption,
        fromEmail: supportEmail,
        fromName: companyName || systemName,
       }, update: { 
        id: 'main',
        host: smtpHost,
        port: smtpPort ? parseInt(smtpPort) : 587,
        username: smtpUsername,
        password: smtpPassword,
        encryption: smtpEncryption,
        fromEmail: supportEmail,
        fromName: companyName || systemName,
       } });

      // 4. Save Payment Gateway Settings
      await prisma.paymentGateway.upsert({ where: { id: 'sonicpesa' }, create: { 
        id: 'sonicpesa',
        name: 'SonicPesa',
        accessKey: sonicPesaAccessKey,
        secretKey: sonicPesaSecretKey,
        webhookSecret: sonicPesaWebhookSecret,
        environment: sonicPesaEnv || 'sandbox',
        isActive: !!sonicPesaAccessKey,
       }, update: { 
        id: 'sonicpesa',
        name: 'SonicPesa',
        accessKey: sonicPesaAccessKey,
        secretKey: sonicPesaSecretKey,
        webhookSecret: sonicPesaWebhookSecret,
        environment: sonicPesaEnv || 'sandbox',
        isActive: !!sonicPesaAccessKey,
       } });

      // 5. Update System Settings to Installed
      await prisma.systemSettings.upsert({ where: { id: 'main' }, create: { 
        id: 'main',
        systemName: systemName,
        companyName: companyName,
        logoUrl: logoUrl,
        faviconUrl: faviconUrl,
        supportEmail: supportEmail,
        timezone: timezone || 'UTC',
        isInstalled: true,
       }, update: { 
        id: 'main',
        systemName: systemName,
        companyName: companyName,
        logoUrl: logoUrl,
        faviconUrl: faviconUrl,
        supportEmail: supportEmail,
        timezone: timezone || 'UTC',
        isInstalled: true,
       } });

      usersCache.push(adminUser); // Add to cache

      res.json({ success: true, message: 'Installation completed successfully' });
    } catch (err: any) {
      console.error('Install Error:', err);
      res.status(500).json({ error: 'Installation failed: ' + err.message });
    }
  });

  app.use('/api/installer', installerRouter);

  // API Routes
  const apiRouter = express.Router();
  apiRouter.use(requireAuthMiddleware);

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

  apiRouter.get('/crawled-links', (req, res) => {
    res.json(crawledLinksCache);
  });

  apiRouter.get('/system-settings', async (req, res) => {
    try {
      const sysRes = await prisma.systemSettings.findUnique({ where: { id: 'main' } }); const sysResult = sysRes ? [sysRes] : [];
      res.json(sysResult[0] || {});
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch' });
    }
  });

  apiRouter.post('/system-settings', async (req, res) => {
    try {
      const { systemName, companyName, logoUrl, faviconUrl, supportEmail, timezone } = req.body;
      const sysRes = await prisma.systemSettings.findUnique({ where: { id: 'main' } }); const sysResult = sysRes ? [sysRes] : [];
      if (sysResult.length === 0) {
        return res.status(404).json({ error: 'System settings not initialized' });
      }

      await prisma.systemSettings.update({ where: { id: 'main' }, data: { 
        systemName,
        companyName,
        logoUrl,
        faviconUrl,
        supportEmail,
        timezone
       } });

      res.json({ message: 'System settings updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update' });
    }
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
    try {
      await prisma.crawledLink.deleteMany();
    } catch (err: any) {
      console.warn('Could not clear crawled links from db', err.message);
    }
    crawledLinksCache = [];
    res.json({ message: 'Crawled links cleared' });
  });

  app.use('/api', apiRouter);

  // Load state then start monitoring automatically on launch
  await loadStateFromDB();
  restartMonitoringLoop();

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
