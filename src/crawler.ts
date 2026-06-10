import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from '../server';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { AppConfig, UptimeLog, CrawledLink } from './types';
import { sendAlert } from './mailer';
import crypto from 'crypto';

puppeteer.use(StealthPlugin());

let isRunning = false;
let nextCheckTime = 0;
let monitorInterval: NodeJS.Timeout | null = null;
let currentConfig: AppConfig | null = null;

export function getMonitorStatus() {
  return {
    isRunning,
    nextCheckTime,
  };
}

export async function startMonitoringLoop() {
  console.log("Starting monitoring loop...");
  if (monitorInterval) clearInterval(monitorInterval);
  
  const runCheck = async () => {
    if (isRunning) {
      console.log("Previous check still running, skipping this cycle.");
      return;
    }
    isRunning = true;
    try {
      if (!db) return;
      
      const configDoc = await getDoc(doc(db, 'config', 'main'));
      if (!configDoc.exists()) return;
      
      currentConfig = configDoc.data() as AppConfig;
      if (!currentConfig.urls || currentConfig.urls.length === 0) {
        console.log("No URLs configured.");
        return;
      }
      
      // Update email from config
      if (currentConfig.email) {
        process.env.ALERT_EMAIL = currentConfig.email;
      }

      await checkUrls(currentConfig);

    } catch (err) {
      console.error("Monitor loop error:", err);
    } finally {
      isRunning = false;
      const intervalSecs = Math.max(currentConfig?.intervalSeconds || 60, 30);
      nextCheckTime = Date.now() + (intervalSecs * 1000);
      monitorInterval = setTimeout(runCheck, intervalSecs * 1000);
    }
  };

  // Run immediately
  runCheck();
}

function parseProxy(proxyStr: string) {
  try {
    const url = new URL(proxyStr.startsWith('http') ? proxyStr : `http://${proxyStr}`);
    return {
      server: `${url.protocol}//${url.hostname}:${url.port}`,
      username: url.username ? decodeURIComponent(url.username) : undefined,
      password: url.password ? decodeURIComponent(url.password) : undefined
    };
  } catch (e) {
    return null;
  }
}

function maskProxy(proxyStr: string) {
  try {
    if (!proxyStr) return 'Direct';
    const url = new URL(proxyStr.startsWith('http') ? proxyStr : `http://${proxyStr}`);
    if (url.username && url.password) {
      return `${url.protocol}//${url.username}:****@${url.hostname}:${url.port}`;
    }
    return proxyStr;
  } catch {
    return proxyStr;
  }
}

async function checkUrls(config: AppConfig) {
  for (const targetUrl of config.urls) {
    console.log(`Checking primary URL: ${targetUrl}`);
    
    // Choose random proxy
    let proxyStr: string | null = null;
    let proxyConfig: any = null;
    if (config.proxies && config.proxies.length > 0) {
      proxyStr = config.proxies[Math.floor(Math.random() * config.proxies.length)];
      proxyConfig = parseProxy(proxyStr);
    }

    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions'
    ];
    
    if (proxyConfig) {
      args.push(`--proxy-server=${proxyConfig.server}`);
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH 
          || '/nix/store/chromium/bin/chromium'
          || (typeof puppeteer.executablePath === 'function' ? puppeteer.executablePath() : undefined),
        args
      });
      
      const page = await browser.newPage();
      if (proxyConfig && proxyConfig.username && proxyConfig.password) {
        await page.authenticate({ username: proxyConfig.username, password: proxyConfig.password });
      }
      
      await page.setViewport({ width: config.viewportWidth || 1366, height: config.viewportHeight || 768 });
      if (config.userAgent) {
        await page.setUserAgent(config.userAgent);
      }

      const startTime = Date.now();
      let status: 'up' | 'down' = 'up';
      let statusCode = 200;
      let errorDetails = '';
      let pageTitle = '';
      let screenshotBase64 = '';
      let discoveredLinks: CrawledLink[] = [];

      try {
        const response = await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        statusCode = response ? response.status() : 0;
        
        if (statusCode >= 400) {
          status = 'down';
          errorDetails = `HTTP Status: ${statusCode}`;
        } else {
          try { pageTitle = await page.title(); } catch(e){}
        }
      } catch (err: any) {
        status = 'down';
        statusCode = 0;
        errorDetails = err.message;
      }

      if (status === 'down') {
        try {
          const buffer = await page.screenshot({ type: 'jpeg', quality: 50, encoding: 'base64' });
          screenshotBase64 = `data:image/jpeg;base64,${buffer}`;
        } catch(e) {}
        
        await sendAlert(targetUrl, errorDetails, maskProxy(proxyStr || ''), pageTitle);
      } else if (config.crawlEnabled) {
        // Extract links
        discoveredLinks = await extractLinksFromPage(page, targetUrl, config.blockedLinks);
      }

      const responseTime = Date.now() - startTime;
      
      // Save log
      await saveLog({
        id: crypto.randomUUID(),
        url: targetUrl,
        status,
        timestamp: new Date().toISOString(),
        responseTime,
        proxyUsed: maskProxy(proxyStr || ''),
        errorDetails: status === 'down' ? errorDetails : undefined,
        statusCode,
        pageTitle,
        screenshotBase64: status === 'down' ? screenshotBase64 : undefined,
      });

      // Cleanup page
      await page.close();

      // Crawl sub-links if parent was UP and crawl enabled
      if (status === 'up' && config.crawlEnabled && discoveredLinks.length > 0) {
        // Save discovered links to DB
        await syncDiscoveredLinks(discoveredLinks);
        
        // Filter sublinks to check (not blocked)
        const toCheck = discoveredLinks.filter(l => !l.isBlocked).slice(0, 20); // max 20 per cycle
        if (toCheck.length > 0) {
          console.log(`Checking ${toCheck.length} sub-links for ${targetUrl}`);
          await checkSubLinks(browser, toCheck, proxyConfig, config, targetUrl);
        }
      }
      
    } catch (err: any) {
      console.error(`Error launching browser for ${targetUrl}:`, err);
    } finally {
      if (browser) {
        try { await browser.close(); } catch(e){}
      }
    }
  }
}

async function extractLinksFromPage(page: any, parentUrl: string, blockedPatterns: string[]): Promise<CrawledLink[]> {
  try {
    const parentParsed = new URL(parentUrl);
    const linksData = await page.evaluate(() => {
      const results: any[] = [];
      const addResult = (href: string | null, text: string, type: string) => {
        if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('data:') && !href.startsWith('blob:') && !href.startsWith('#')) {
          results.push({ href: href.trim(), linkText: text.trim().substring(0, 100), linkType: type });
        }
      };

      // 1. Anchors
      document.querySelectorAll('a[href]').forEach((el: any) => {
        addResult(el.href, el.innerText || el.textContent, 'anchor');
      });

      // 2. Buttons with nav
      document.querySelectorAll('button').forEach((b: any) => {
        const href = b.getAttribute('data-href') || b.getAttribute('data-url') || b.getAttribute('data-link') || b.getAttribute('data-route');
        if (href) addResult(href, b.innerText || b.textContent, 'button');
        if (b.hasAttribute('onclick')) {
          const match = b.getAttribute('onclick')?.match(/(https?:\/\/[^\s'"]+|\/[a-zA-Z0-9\-_\/]+)/);
          if (match) addResult(match[1], b.innerText, 'button');
        }
      });

      // 3. Onclick general
      document.querySelectorAll('[onclick]').forEach((el: any) => {
        if (el.tagName !== 'BUTTON') {
          const match = el.getAttribute('onclick')?.match(/(https?:\/\/[^\s'"]+|\/[a-zA-Z0-9\-_\/]+)/);
          if (match) addResult(match[1], el.innerText || '', 'onclick');
        }
      });

      // 4 & 5. Images
      document.querySelectorAll('a img, a picture').forEach((el: any) => {
        const a = el.closest('a');
        if (a && a.href) addResult(a.href, el.alt || 'image', 'image');
      });
      document.querySelectorAll('img[src]').forEach((el: any) => {
        addResult(el.src, el.alt || 'img-src', 'srcset');
      });

      // 6. Form
      document.querySelectorAll('form[action]').forEach((f: any) => {
        addResult(f.action, 'form submission', 'form');
      });

      // 7. Area
      document.querySelectorAll('area[href]').forEach((a: any) => {
        addResult(a.href, a.alt || 'area link', 'area');
      });

      return results;
    });

    // Deduplicate and process
    const uniqueMap = new Map<string, CrawledLink>();
    for (const ld of linksData) {
      try {
        const url = new URL(ld.href, parentUrl);
        const absoluteHref = url.href;
        
        let isBlocked = false;
        for (const bp of blockedPatterns) {
          if (bp && absoluteHref.includes(bp)) isBlocked = true;
        }

        if (!uniqueMap.has(absoluteHref)) {
          uniqueMap.set(absoluteHref, {
            id: crypto.randomUUID(),
            parentUrl,
            href: absoluteHref,
            linkText: ld.linkText,
            linkType: ld.linkType,
            isStatic: absoluteHref.includes('.') && !absoluteHref.includes('.html') && !absoluteHref.includes('.php'),
            isDynamic: absoluteHref.includes('?') || absoluteHref.includes('='),
            isExternal: url.hostname !== parentParsed.hostname,
            isBlocked,
            lastStatus: 'pending',
            depth: 1
          });
        }
      } catch (e) {} // ignore invalid URLs
    }
    
    return Array.from(uniqueMap.values());
  } catch (err) {
    console.error(`Error extracting links from ${parentUrl}:`, err);
    return [];
  }
}

async function syncDiscoveredLinks(links: CrawledLink[]) {
  if (!db) return;
  try {
    const snap = await getDocs(collection(db, 'crawled_links'));
    const existing = new Map();
    snap.forEach(d => existing.set(d.data().href, d.ref));

    const batch = writeBatch(db);
    for (const l of links) {
      if (!existing.has(l.href)) {
        batch.set(doc(collection(db, 'crawled_links')), l);
      }
    }
    await batch.commit();
  } catch(e) {
    console.error("Sync links error:", e);
  }
}

async function checkSubLinks(browser: any, links: CrawledLink[], proxyConfig: any, config: AppConfig, parentUrl: string) {
  // Process in batches of 5
  const batchSize = 5;
  for (let i = 0; i < links.length; i += batchSize) {
    const chunk = links.slice(i, i + batchSize);
    
    const promises = chunk.map(async (link) => {
      const page = await browser.newPage();
      if (proxyConfig && proxyConfig.username && proxyConfig.password) {
        await page.authenticate({ username: proxyConfig.username, password: proxyConfig.password });
      }
      if (config.userAgent) await page.setUserAgent(config.userAgent);
      
      const startTime = Date.now();
      let status: 'up' | 'down' = 'up';
      let statusCode = 200;
      let errorDetails = '';

      // Timeout safety net
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 20000));
      const gotoPromise = page.goto(link.href, { waitUntil: 'load', timeout: 15000 }); // faster wait for sublinks
      
      try {
        const response = await Promise.race([gotoPromise, timeoutPromise]) as any;
        statusCode = response ? response.status() : 0;
        if (statusCode >= 400) {
          status = 'down';
          errorDetails = `HTTP Status: ${statusCode}`;
        }
      } catch (err: any) {
        status = 'down';
        statusCode = 0;
        errorDetails = err.message;
      }
      
      const responseTime = Date.now() - startTime;
      
      // Log failure
      if (status === 'down') {
        let proxyUsedStr = proxyConfig ? `${proxyConfig.server}` : 'Direct';
        await sendAlert(link.href, `Sub-link failure from ${parentUrl}. Details: ${errorDetails}`, maskProxy(proxyUsedStr));
        
        await saveLog({
          id: crypto.randomUUID(),
          url: link.href,
          status,
          timestamp: new Date().toISOString(),
          responseTime,
          proxyUsed: maskProxy(proxyUsedStr),
          errorDetails,
          isSubLink: true,
          parentUrl: parentUrl,
          linkType: link.linkType,
          statusCode
        });
      }
      
      // Update link status in DB
      try {
        if (db) {
          const snap = await getDocs(collection(db, 'crawled_links'));
          const batch = writeBatch(db);
          snap.forEach(d => {
            if (d.data().href === link.href) {
              batch.update(d.ref, { lastStatus: status, lastChecked: new Date().toISOString(), responseTime, statusCode });
            }
          });
          await batch.commit();
        }
      } catch(e) {}

      try { await page.close(); } catch(e){}
    });
    
    await Promise.allSettled(promises);
  }
}

async function saveLog(log: UptimeLog) {
  if (!db) return;
  try {
    await setDoc(doc(db, 'logs', log.id), log);
  } catch(e) {}
}
