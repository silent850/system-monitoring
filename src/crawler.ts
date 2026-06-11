import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { AppConfig, UptimeLog, CrawledLink } from './types';
import { sendAlert } from './mailer';
import crypto from 'crypto';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

function getChromiumPath(): string | undefined {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  // 1. Search dynamically inside standard Puppeteer caches
  try {
    const cacheDir = '/root/.cache/puppeteer/chrome';
    if (fs.existsSync(cacheDir)) {
      const versions = fs.readdirSync(cacheDir);
      for (const ver of versions) {
        const fullPath = path.join(cacheDir, ver, 'chrome-linux64', 'chrome');
        if (fs.existsSync(fullPath)) {
          console.log(`Matched dynamic Chrome for Testing path at: ${fullPath}`);
          return fullPath;
        }
      }
    }
  } catch (e) {
    console.error("Error searching dynamically in cache directory:", e);
  }

  // 2. Fallbacks to standard paths
  const systemPaths = [
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable'
  ];
  for (const sPath of systemPaths) {
    try {
      if (fs.existsSync(sPath)) {
        console.log(`Found system browser at: ${sPath}`);
        return sPath;
      }
    } catch (e) {}
  }

  // 3. Fallback to child process detection
  try {
    const detected = execSync('which chromium || which chromium-browser || which google-chrome-stable || which google-chrome', { encoding: 'utf8', stdio: [] }).trim();
    if (detected) {
      console.log(`Detected Chromium/Chrome via command search: ${detected}`);
      return detected;
    }
  } catch (e) {
    // Suppress verbose error, since we have local scan
  }

  console.log("No explicit browser path verified found. Defaulting to Puppeteer auto-resolution (undefined).");
  return undefined;
}

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
    const port = url.port || '80';
    return {
      server: `http://${url.hostname}:${port}`,
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
    const port = url.port || '80';
    if (url.username && url.password) {
      return `${url.protocol}//${url.username}:****@${url.hostname}:${port}`;
    }
    return `${url.protocol}//${url.hostname}:${port}`;
  } catch {
    return proxyStr;
  }
}

async function simulateClicksAndEngagement(page: any, targetUrl: string, config: AppConfig, proxyConfig: any) {
  try {
    console.log(`Simulating browser clicks & realistic engagements on ${targetUrl}...`);
    
    // Extract unique sublinks and buttons for separate background tab visits
    const sublinks = await page.evaluate(() => {
      const urls: string[] = [];
      const elements = Array.from(document.querySelectorAll('a, button, img'));
      for (const el of elements) {
        let href = '';
        if (el.tagName === 'A') {
          href = (el as HTMLAnchorElement).href;
        } else if (el.tagName === 'BUTTON') {
          href = el.getAttribute('data-href') || el.getAttribute('data-url') || '';
        } else if (el.tagName === 'IMG') {
          const parentA = el.closest('a');
          if (parentA) href = parentA.href;
        }
        
        if (href && href.startsWith('http') && !href.includes('#') && !urls.includes(href)) {
          urls.push(href);
          if (urls.length >= 8) break;
        }
      }
      return urls;
    });

    console.log(`Found ${sublinks.length} primary sub-page links for deep visitor stats loading.`);

    // Part A: Native on-page button, image, and link click actions with dynamic auto-close and back-routing
    const browserRef = page.browser();
    
    // Auto-close handler for newly created tabs/popups triggered by clicks
    const closeNewTabs = async (target: any) => {
      try {
        if (target.type() === 'page') {
          const newPage = await target.page();
          if (newPage) {
            if (proxyConfig && proxyConfig.username && proxyConfig.password) {
              await newPage.authenticate({ username: proxyConfig.username, password: proxyConfig.password });
            }
            if (config.userAgent) {
              await newPage.setUserAgent(config.userAgent);
            }
            // Inject dynamic webdriver bypass for newly initialized tabs
            await newPage.evaluateOnNewDocument(() => {
              Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
              (window as any).chrome = { app: { isInstalled: false }, runtime: {} };
              Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
            });
            console.log(`[Popup Tracker] Click opened new tab/popup to: ${newPage.url()}. Waiting 8 seconds to register full visitor stats...`);
            await new Promise(r => setTimeout(r, 8000));
            await newPage.close();
            console.log(`[Popup Tracker] Successfully closed tab.`);
          }
        }
      } catch (e: any) {
        console.error("Error handling dynamic popup auto-close:", e.message);
      }
    };
    browserRef.on('targetcreated', closeNewTabs);

    try {
      // Find visible clickable elements on the page (buttons, links, images, onclicks)
      const clickables = await page.evaluate(() => {
        const items: { tag: string; text: string; index: number }[] = [];
        const els = Array.from(document.querySelectorAll('button, a, img, [role="button"], [onclick]'));
        let count = 0;
        for (let i = 0; i < els.length; i++) {
          const el = els[i] as HTMLElement;
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            el.setAttribute('data-sentinel-click-index', String(count));
            items.push({
              tag: el.tagName,
              text: (el.innerText || el.getAttribute('alt') || el.getAttribute('src') || '').substring(0, 30).trim(),
              index: count
            });
            count++;
            if (items.length >= 10) break; // Limit interactions per cycle for stability
          }
        }
        return items;
      });

      console.log(`Discovered ${clickables.length} clickable elements on the main page. Injecting real clicks...`);
      for (const item of clickables) {
        try {
          const selector = `[data-sentinel-click-index="${item.index}"]`;
          const handle = await page.$(selector);
          if (handle) {
            console.log(`[Native Click] Clicking <${item.tag}> "${item.text}"`);
            
            // Smooth scroll to simulate real user behavior 
            await page.evaluate((sel: string) => {
              const el = document.querySelector(sel);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, selector);
            await new Promise(r => setTimeout(r, 1500)); 

            // Click the element!
            await handle.click();
            
            // Wait for dynamic loads / transitions
            await new Promise(r => setTimeout(r, 4000));

            // Check if click navigated the main page itself
            const currentUrl = page.url();
            if (currentUrl !== targetUrl && !currentUrl.startsWith('about:')) {
              console.log(`[Navigation Tracker] Click caused same-tab redirection to: ${currentUrl}. Waiting 8 seconds for visitor tracker/AdSense, then returning back...`);
              await new Promise(r => setTimeout(r, 8000));
              await page.goBack({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
              console.log(`[Navigation Tracker] Re-anchored to main url: ${page.url()}`);
            }
          }
        } catch (clickErr: any) {
          console.error(`Error during native click on <${item.tag}>:`, clickErr.message);
        }
      }
    } catch (e: any) {
      console.error("Failed to query clickable elements on page:", e.message);
    } finally {
      // Clean up target listener
      browserRef.off('targetcreated', closeNewTabs);
    }

    // Part B: Deep visiting of sub-links in dedicated tabs
    for (const url of sublinks) {
      let isBlocked = false;
      if (config.blockedLinks) {
        for (const bp of config.blockedLinks) {
          if (bp && url.includes(bp)) isBlocked = true;
        }
      }
      if (isBlocked) {
        console.log(`Skipping blocked URL: ${url}`);
        continue;
      }

      console.log(`Mimicking human view & click to load sublink: ${url}`);
      let linkPage;
      try {
        linkPage = await page.browser().newPage();
        if (proxyConfig && proxyConfig.username && proxyConfig.password) {
          await linkPage.authenticate({ username: proxyConfig.username, password: proxyConfig.password });
        }
        if (config.userAgent) {
          await linkPage.setUserAgent(config.userAgent);
        }
        await linkPage.setViewport({ width: config.viewportWidth || 1366, height: config.viewportHeight || 768 });
        
        // Inject dynamic webdriver bypass for sublink pages
        await linkPage.evaluateOnNewDocument(() => {
          Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
          (window as any).chrome = { app: { isInstalled: false }, runtime: {} };
          Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
          Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        });

        await linkPage.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        
        // Scroll slightly
        await linkPage.evaluate(async () => {
          window.scrollBy(0, 400);
          await new Promise(r => setTimeout(r, 1500));
          window.scrollBy(0, 400);
        });

        console.log(`Keeping sublink page open to register stats for 8 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 8000));
        
        await linkPage.close();
        console.log(`Closed page for ${url}`);
      } catch (err: any) {
        console.error(`Error processing click visit for ${url}:`, err.message);
        if (linkPage) {
          try { await linkPage.close(); } catch (e) {}
        }
      }
    }
  } catch (err: any) {
    console.error(`Error during physical click simulation on ${targetUrl}:`, err);
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
      '--disable-extensions',
      '--disable-software-rasterizer',
      '--disable-features=VizDisplayCompositor'
    ];
    
    if (proxyConfig) {
      args.push(`--proxy-server=${proxyConfig.server}`);
    }

    let browser;
    try {
      const chromiumPath = getChromiumPath();
      console.log(`Launching Puppeteer with Chromium from: ${chromiumPath}`);
      browser = await puppeteer.launch({
        headless: true,
        executablePath: chromiumPath,
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

      // Inject dynamic webdriver bypass for maximum visitor tracking trust
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        (window as any).chrome = { app: { isInstalled: false }, runtime: {} };
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      });

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
      } else {
        // Main page successfully loaded
        try {
          await page.evaluate(async () => {
            window.scrollBy(0, 400);
            await new Promise(r => setTimeout(r, 1000));
            window.scrollBy(0, 400);
          });
        } catch (e) {}

        // Wait 10s to ensure visitor trackers fully trigger and register in site stats
        console.log(`Page parsed successfully. Waiting 10 seconds for visitor tracking/AdSense/Google Analytics...`);
        await new Promise(resolve => setTimeout(resolve, 10000));

        if (config.crawlEnabled) {
          // Extract links
          discoveredLinks = await extractLinksFromPage(page, targetUrl, config.blockedLinks);
          
          // Physically click buttons/links/images, wait for load, and close
          await simulateClicksAndEngagement(page, targetUrl, config, proxyConfig);
        }
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
      
      // Inject dynamic webdriver bypass for maximum visitor tracking trust
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
        (window as any).chrome = { app: { isInstalled: false }, runtime: {} };
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      });
      
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

      // Wait for 7 seconds to register sublink visitor stats if UP
      if (status === 'up') {
        console.log(`Sub-link ${link.href} loaded successfully. Waiting 7s to register stats...`);
        await new Promise(r => setTimeout(r, 7000));
      }

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
