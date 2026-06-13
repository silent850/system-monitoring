# SaaS Architecture & Refactoring Plan

This document outlines the migration strategy to separate this project into a production-grade multi-tenant SaaS architecture. It meets your requirements for splitting the system into dedicated Microservices, Workers, and a centralized Message Queue using Prisma, BullMQ, Redis, and Railway.

---

## 1. Environment & Migration Strategy for Railway

Railway makes it trivial to run multi-service architectures. 

**Railway Components Needed:**
1. **PostgreSQL Database** (Handles Prisma + core data)
2. **Redis Instance** (Handles BullMQ logic + Caching)
3. **API Service** (Express app running API logic)
4. **Worker Service** (Node app polling BullMQ and executing tasks)

**Railway Start Commands:**
- **API Server**: `npm run start:api` (`node dist/api.cjs`)
- **Worker Server**: `npm run start:worker` (`node dist/worker.cjs`)

**Database Migrations (Prisma):**
In Railway, map `DATABASE_URL` to your provisioned Postgres. We have transitioned from Drizzle ORM to Prisma to better match typical Node.js SaaS templates. The full Prisma schema is located in `/prisma/schema.prisma`. 

During the CI/CD pipeline, the build script should run:
```bash
npx prisma generate
npx prisma migrate deploy
```

---

## 2. API Server Architecture

The core API Server (`/src/api`) handles incoming HTTP requests, Installer procedures, and Authentication.

1. **Boot Safety Engine**: 
   The Express server executes a DB ping on startup. If the database exists but the `SystemSettings` table is missing, the API router blocks all routes except `/api/installer`. 
   We have already modified the `server.ts` file in this codebase to catch Postgres error `42P01` (Relation does not exist), allowing the installer UI to safely load.
   
2. **Multi-Tenancy Guardrails**: 
   All Express routes use a custom middleware that dynamically injects `req.user.companyId`. Database queries via Prisma are strictly scoped:
   ```typescript
   const monitors = await prisma.monitor.findMany({
      where: { companyId: req.user.companyId }
   });
   ```

---

## 3. Worker Architecture (BullMQ + Redis)

The monitoring engine has been conceptually split into three isolated workers. 

1. **Uptime Worker (`worker/uptime.ts`)**
   Executes standard HTTP GET/HEAD requests via Axios, handling proxy rotations.
2. **Browser Worker (`worker/playwright.ts`)**
   Spins up a headless Chromium instance to navigate the target UI, executing DOM assertions and taking screenshots. 
3. **Crawler Worker (`worker/crawler.ts`)**
   Uses Cheerio to build an AST of the DOM and recursively extract child links for discovery logic.

### BullMQ Integration: Queue Configuration
```typescript
import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD
};

export const uptimeQueue = new Queue('UptimeChecks', { connection });
export const browserQueue = new Queue('BrowserChecks', { connection });
export const alertQueue = new Queue('Alerts', { connection });
```

### BullMQ Integration: Worker Loop
```typescript
import { Worker } from 'bullmq';
import { prisma } from '../db';
import axios from 'axios';

const uptimeWorker = new Worker('UptimeChecks', async job => {
  const { monitorId, url } = job.data;
  const start = Date.now();
  
  try {
    const res = await axios.get(url, { timeout: 10000 });
    await prisma.uptimeCheck.create({
      data: {
        monitorId,
        status: 'up',
        responseTime: Date.now() - start
      }
    });
  } catch (error) {
    // 1. Log failure
    await prisma.uptimeCheck.create({
      data: {
        monitorId,
        status: 'down',
        responseTime: Date.now() - start,
        errorDetails: error.message
      }
    });
    // 2. Queue Alert
    await alertQueue.add('SendAlert', { monitorId, error: error.message });
  }
}, { connection });
```

---

## 4. Installer Rewrite

The installer flow is accessible immediately after spinning up the Railway container:
1. Administrator visits the application.
2. The UI checks `/api/installer/status`. Since `needsMigration` is true, the user is redirected to `/install`.
3. The Setup Wizard requires:
   * Company Name
   * Administrator Email / Password
   * System Name / Brand Settings (Logo, Favicon)
   * Payment Gateway Credentials (SonicPesa)
   * SMTP Server Credentials
4. On Submission:
   * `npx prisma migrate deploy` is triggered programmatically or via child process if not already run in CI.
   * `SystemSettings` row is populated safely as ID `main`.
   * Standard Admin User is created and cached.

---

## 5. Alerting & Reporting System

Alerts have been shifted out of the direct synchronous HTTP lifecycle and into the `alertQueue`. The Alert worker queries the cached `SmtpSettings` and fires node-mailer instances, or executes Webhook POSTs to third-party integrations (e.g. Slack).

**PDF Generation (Pdfkit)**
The system can offload memory-heavy report generation to the worker process. The worker can inject custom branding elements from `SystemSettings` into the pdfkit stream:

```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generateReport = async (companyId: string, timeframe: string) => {
   const settings = await prisma.systemSettings.findUnique({ where: { id: 'main' } });
   const doc = new PDFDocument();
   
   // Apply specific Brand assets
   doc.text(settings.systemName, 10, 10);
   if (settings.logoUrl) {
      // Load remote image and pipe to pdf stream
   }
   
   // ... Write Table logic
   doc.pipe(fs.createWriteStream(`./tmp/report-${companyId}.pdf`));
   doc.end();
}
```

---

## 6. Payment Logic with SonicPesa

Using the `paymentGateways` config row stored in Postgres, your Stripe/SonicPesa logic should read API Keys on startup or query them dynamically per tenant. Under this setup, a `Subscription` watcher listens to Webhook paths:

* `POST /api/webhooks/sonicpesa`
* Automatically updates the `Subscription` table, altering access controls mapped directly to the `UserRole` and `Permission` matrices within Prisma.
