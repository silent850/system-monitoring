import express from "express";
import path from "path";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, desc, and } from "drizzle-orm";
import cookieParser from "cookie-parser";
import * as schema from "./src/db/schema.js";

const { Pool } = pg;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Real DB connection logic
  let db: ReturnType<typeof drizzle> | null = null;
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    console.log("Found DATABASE_URL, connecting to PostgreSQL in production mode...");
    const pool = new Pool({ connectionString: dbUrl });
    db = drizzle(pool);
  } else {
    console.log("No DATABASE_URL found, running in limited memory mode...");
  }

  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));
  app.use(cookieParser());

  // In-memory pseudo DB fallback
  const memoryDb: any = {
    settings: {
      systemName: "Uptime Pulse",
      logo: "",
      installed: dbUrl ? true : false,
      sonicPesaKey: process.env.SONICPESA_API_KEY || "",
      sonicPesaSecret: process.env.SONICPESA_API_SECRET || "",
    },
    monitors: [
      { id: 1, name: "API Production", url: "https://api.example.com/health", type: "api", status: "up", checkInterval: 60, lastChecked: Date.now(), avgLoadTime: 120, company: "Acme Corp", companyId: 1 },
      { id: 2, name: "Marketing Site", url: "https://example.com", type: "site", status: "down", checkInterval: 60, lastChecked: Date.now(), avgLoadTime: 850, company: "Acme Corp", companyId: 1 }
    ],
    companies: [
      { id: 1, name: "Acme Corp", billingPlan: "pro" },
      { id: 2, name: "Globex Inc", billingPlan: "free" }
    ],
    users: [
      { id: 1, name: "Admin", email: "admin@example.com", role: "Super Admin" },
      { id: 2, name: "John Doe", email: "john@acmecorp.com", role: "Viewer" }
    ],
    proxies: [],
    logs: [],
    sessions: [],
    sessionSteps: [],
    detectedLinks: []
  };

  // API Routes
  
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  app.get("/api/system/status", (req, res) => {
    res.json({ installed: memoryDb.settings.installed, systemName: memoryDb.settings.systemName });
  });

  app.post("/api/system/install", (req, res) => {
    const { systemName, dbUrl: incomingDbUrl, adminEmail, sonicPesaKey, sonicPesaSecret } = req.body;
    memoryDb.settings.systemName = systemName || "Uptime Pulse";
    if (sonicPesaKey) memoryDb.settings.sonicPesaKey = sonicPesaKey;
    if (sonicPesaSecret) memoryDb.settings.sonicPesaSecret = sonicPesaSecret;
    memoryDb.settings.installed = true;
    res.json({ success: true, message: "System installed." });
  });

  // Settings
  app.post("/api/settings/general", async (req, res) => {
    const { systemName } = req.body;
    memoryDb.settings.systemName = systemName;
    if (db) {
      // Basic fallback since system_settings isn't clearly defined in schema yet,
      // but prompt says "update memoryDb.settings.systemName (and DB system_settings table if db exists)".
      // Assuming we just try-catch to avoid crashing if table is missing.
      try {
        if ('system_settings' in schema) {
          // @ts-ignore
          await db.insert(schema.system_settings).values({ key: 'systemName', value: systemName }).onConflictDoUpdate({ target: schema.system_settings.key, set: { value: systemName } });
        }
      } catch(e) {}
    }
    res.json({ success: true });
  });

  app.post("/api/settings/integrations", async (req, res) => {
    const { sonicPesaKey, sonicPesaSecret } = req.body;
    memoryDb.settings.sonicPesaKey = sonicPesaKey;
    memoryDb.settings.sonicPesaSecret = sonicPesaSecret;
    if (db) {
      try {
        if ('system_settings' in schema) {
        // @ts-ignore
        await db.insert(schema.system_settings).values({ key: 'sonicPesaKey', value: sonicPesaKey }).onConflictDoUpdate({ target: schema.system_settings.key, set: { value: sonicPesaKey } });
        // @ts-ignore
        await db.insert(schema.system_settings).values({ key: 'sonicPesaSecret', value: sonicPesaSecret }).onConflictDoUpdate({ target: schema.system_settings.key, set: { value: sonicPesaSecret } });
        }
      } catch(e) {}
    }
    res.json({ success: true });
  });

  app.get("/api/settings", (req, res) => {
    const key = memoryDb.settings.sonicPesaKey;
    const secret = memoryDb.settings.sonicPesaSecret;
    res.json({
      systemName: memoryDb.settings.systemName,
      sonicPesaKey: key ? `****${key.slice(-4)}` : "",
      sonicPesaSecret: secret ? `****${secret.slice(-4)}` : ""
    });
  });

  // Auth
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "admin@example.com") {
      res.cookie("session", "admin-token", { httpOnly: true, maxAge: 86400000 });
      res.json({ success: true, user: { email, role: "admin" } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.cookies.session === "admin-token") {
      res.json({ email: "admin@example.com", role: "admin" });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("session");
    res.json({ success: true });
  });

  // Portal Auth
  app.post("/api/portal/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (email === "client@acmecorp.com" && password === "password") {
      res.cookie("portal-session", "company-1-token", { httpOnly: true, maxAge: 86400000 });
      res.json({ success: true, company: { id: 1, name: "Acme Corp" } });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/portal/auth/me", (req, res) => {
    if (req.cookies["portal-session"] === "company-1-token") {
      res.json({ company: { id: 1, name: "Acme Corp" } });
    } else {
      res.status(401).json({ error: "Unauthorized" });
    }
  });
  
  app.post("/api/portal/auth/logout", (req, res) => {
    res.clearCookie("portal-session");
    res.json({ success: true });
  });

  app.get("/api/portal/dashboard", (req, res) => {
    // For Acme Corp (id: 1)
    const companyMonitors = memoryDb.monitors.filter((m: any) => m.companyId === 1 || m.company === "Acme Corp");
    const totalMonitors = companyMonitors.length;
    const upCount = companyMonitors.filter((m: any) => m.status === "up").length;
    const downCount = companyMonitors.filter((m: any) => m.status === "down").length;
    const sumLoad = companyMonitors.reduce((acc: number, m: any) => acc + (m.avgLoadTime || 0), 0);
    const avgResponseTime = totalMonitors > 0 ? Math.round(sumLoad / totalMonitors) : 0;
    res.json({ totalMonitors, upCount, downCount, avgResponseTime });
  });

  app.get("/api/portal/monitors", (req, res) => {
    res.json(memoryDb.monitors.filter((m: any) => m.companyId === 1 || m.company === "Acme Corp"));
  });

  // Monitors
  app.get("/api/monitors", async (req, res) => {
    if (db) {
      try {
        const rows = await db.select().from(schema.monitors);
        return res.json(rows);
      } catch(e) {
        // Fallback to memory if table doesn't exist
      }
    }
    res.json(memoryDb.monitors);
  });

  app.post("/api/monitors", async (req, res) => {
    const { name, url, type, companyId, checkInterval, company } = req.body;
    if (db) {
      try {
        // @ts-ignore
        const rows = await db.insert(schema.monitors).values({ name, url, type, companyId: companyId || null, checkInterval: checkInterval || 60, status: "pending" }).returning();
        return res.json(rows[0]);
      } catch (e) {}
    }
    const id = memoryDb.monitors.length > 0 ? Math.max(...memoryDb.monitors.map((m: any) => m.id)) + 1 : 1;
    const newMonitor = { id, name, url, type, companyId: Number(companyId) || 1, company: company || "Unknown", checkInterval: Number(checkInterval) || 60, status: "pending", lastChecked: Date.now(), avgLoadTime: 0 };
    memoryDb.monitors.push(newMonitor);
    res.json(newMonitor);
  });

  app.put("/api/monitors/:id", async (req, res) => {
    const id = Number(req.params.id);
    const { name, url, type, status, checkInterval } = req.body;
    if (db) {
      try {
        // @ts-ignore
        const rows = await db.update(schema.monitors).set({ name, url, type, status, checkInterval }).where(eq(schema.monitors.id, id)).returning();
        if (rows.length > 0) return res.json(rows[0]);
      } catch(e) {}
    }
    const idx = memoryDb.monitors.findIndex((m: any) => m.id === id);
    if (idx !== -1) {
      memoryDb.monitors[idx] = { ...memoryDb.monitors[idx], ...req.body };
      res.json(memoryDb.monitors[idx]);
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.delete("/api/monitors/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (db) {
      try {
        // @ts-ignore
        await db.delete(schema.monitors).where(eq(schema.monitors.id, id));
        return res.json({ success: true });
      } catch(e) {}
    }
    memoryDb.monitors = memoryDb.monitors.filter((m: any) => m.id !== id);
    res.json({ success: true });
  });

  // Companies
  app.get("/api/companies", async (req, res) => {
    if (db) {
      try {
        if ('companies' in schema) {
          // @ts-ignore
          const rows = await db.select().from(schema.companies);
          return res.json(rows);
        }
      } catch(e) {}
    }
    res.json(memoryDb.companies);
  });

  app.post("/api/companies", async (req, res) => {
    const { name, billingPlan } = req.body;
    if (db) {
      try {
        if ('companies' in schema) {
        // @ts-ignore
        const rows = await db.insert(schema.companies).values({ name, billingPlan }).returning();
        return res.json(rows[0]);
        }
      } catch(e) {}
    }
    const id = memoryDb.companies.length > 0 ? Math.max(...memoryDb.companies.map((c: any) => c.id)) + 1 : 1;
    const newCo = { id, name, billingPlan };
    memoryDb.companies.push(newCo);
    res.json(newCo);
  });

  // Users
  app.get("/api/users", async (req, res) => {
    if (db) {
      try {
        if ('users' in schema) {
          // @ts-ignore
          const rows = await db.select({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role }).from(schema.users);
          return res.json(rows);
        }
      } catch(e) {}
    }
    res.json(memoryDb.users);
  });

  app.post("/api/users", async (req, res) => {
    const { name, email, role } = req.body;
    const passwordHash = crypto.createHash('sha256').update("changeme123").digest('hex');
    if (db) {
      try {
        if ('users' in schema) {
          // @ts-ignore
          const rows = await db.insert(schema.users).values({ name, email, role, passwordHash }).returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email, role: schema.users.role });
          return res.json(rows[0]);
        }
      } catch(e) {}
    }
    const id = memoryDb.users.length > 0 ? Math.max(...memoryDb.users.map((c: any) => c.id)) + 1 : 1;
    const newU = { id, name, email, role };
    memoryDb.users.push(newU);
    res.json(newU);
  });

  // Proxies
  app.get("/api/proxies", async (req, res) => {
    if (db) {
      try {
        if ('proxies' in schema) {
          // @ts-ignore
          const rows = await db.select().from(schema.proxies);
          return res.json(rows);
        }
      } catch(e) {}
    }
    res.json(memoryDb.proxies);
  });

  app.post("/api/proxies", async (req, res) => {
    const { label, address, groupId } = req.body;
    if (db) {
      try {
        if ('proxies' in schema) {
          // @ts-ignore
          const rows = await db.insert(schema.proxies).values({ label, address, groupId: Number(groupId) || null, status: 'active', lastUsed: new Date() }).returning();
          return res.json(rows[0]);
        }
      } catch(e) {}
    }
    const id = memoryDb.proxies.length > 0 ? Math.max(...memoryDb.proxies.map((c: any) => c.id)) + 1 : 1;
    const newP = { id, label, address, groupId: Number(groupId) || null, status: 'active', lastUsed: Date.now() };
    memoryDb.proxies.push(newP);
    res.json(newP);
  });

  app.delete("/api/proxies/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (db) {
      try {
        if ('proxies' in schema) {
          // @ts-ignore
          await db.delete(schema.proxies).where(eq(schema.proxies.id, id));
          return res.json({ success: true });
        }
      } catch(e) {}
    }
    memoryDb.proxies = memoryDb.proxies.filter((p: any) => p.id !== id);
    res.json({ success: true });
  });

  app.get("/api/live-feed", async (req, res) => {
    if (db) {
      try {
        if ('sessions' in schema && 'monitors' in schema) {
          // @ts-ignore
          const rows = await db.select({
            id: schema.sessions.id,
            startedAt: schema.sessions.startedAt,
            status: schema.sessions.status,
            monitorId: schema.sessions.monitorId,
            monitorName: schema.monitors.name,
            totalDuration: schema.sessions.totalDuration,
            proxyUsed: schema.sessions.proxyUsed
          // @ts-ignore
          }).from(schema.sessions).leftJoin(schema.monitors, eq(schema.sessions.monitorId, schema.monitors.id)).orderBy(desc(schema.sessions.startedAt)).limit(50);
          return res.json(rows);
        }
      } catch(e) {}
    }
    // Memory DB join mock
    const sorted = [...memoryDb.sessions].sort((a: any, b: any) => b.startedAt - a.startedAt).slice(0, 50);
    const enriched = sorted.map(s => {
      const m = memoryDb.monitors.find((m: any) => m.id.toString() === s.monitorId.toString());
      return { ...s, monitorName: m ? m.name : "Unknown Monitor", company: m ? m.company : "" };
    });
    res.json(enriched);
  });

  // Real SonicPesa integration proxy
  app.post("/api/v1/payment/create_order", async (req, res) => {
    const { amount, phone, currency, email, name } = req.body;
    const apiKey = memoryDb.settings.sonicPesaKey || process.env.SONICPESA_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ status: "error", message: "SonicPesa API Key not configured" });
    }

    try {
      const sonicRes = await fetch("https://api.sonicpesa.com/api/v1/payment/create_order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({
          buyer_email: email || "customer@example.com",
          buyer_name: name || "Customer",
          buyer_phone: phone,
          amount: amount,
          currency: currency || "TZS"
        })
      });

      const data = await sonicRes.json();
      res.json(data);
    } catch (err) {
      console.error("SonicPesa integration error:", err);
      res.status(500).json({ status: "error", message: "Failed to communicate with payment gateway" });
    }
  });

  app.post("/api/v1/payment/order_status", async (req, res) => {
    const { order_id } = req.body;
    const apiKey = memoryDb.settings.sonicPesaKey || process.env.SONICPESA_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ status: "error", message: "SonicPesa API Key not configured" });
    }

    try {
      const sonicRes = await fetch("https://api.sonicpesa.com/api/v1/payment/order_status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: JSON.stringify({ order_id })
      });

      const data = await sonicRes.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ status: "error", message: "Failed to communicate with payment gateway" });
    }
  });

  app.post("/api/webhooks/sonicpesa", (req: any, res: any) => {
    const signature = req.headers["x-sonicpesa-signature"];
    const apiSecret = memoryDb.settings.sonicPesaSecret || process.env.SONICPESA_API_SECRET;

    if (!apiSecret) {
      return res.status(500).send("Webhook secret not configured.");
    }

    if (!signature) {
      return res.status(400).send("No signature block found");
    }

    const expectedSignature = crypto
      .createHmac("sha256", apiSecret)
      .update(req.rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("Webhook signature mismatch.");
      return res.status(400).send("Invalid signature");
    }

    const payload = req.body;
    console.log("Received Valid Webhook from SonicPesa:", payload.event);

    if (payload.event === "payment.completed") {
      console.log(`Payment successful for order: ${payload.order_id}, amount: ${payload.amount}`);
    }

    res.status(200).send("Webhook received");
  });

  app.get("/api/transactions", async (req, res) => {
    res.json({
        "status": "success",
        "data": []
    });
  });

  // --- Live Activity / Crawler API Routes ---
  app.get("/api/monitors/:id", async (req, res) => {
    const monitor = memoryDb.monitors.find((m: any) => m.id.toString() === req.params.id);
    if (!monitor) return res.status(404).json({ error: "Monitor not found" });
    res.json(monitor);
  });

  app.get("/api/monitors/:id/sessions", async (req, res) => {
    const sessions = memoryDb.sessions.filter((s: any) => s.monitorId.toString() === req.params.id);
    res.json(sessions);
  });

  app.post("/api/monitors/:id/run", async (req, res) => {
    const { proxyUsed, simulateHuman, humanProfile, crawlerDepth, maxLinks, followExternal } = req.body;
    
    const newSession = {
      id: Date.now().toString(),
      monitorId: req.params.id,
      startedAt: Date.now(),
      status: "running",
      proxyUsed: proxyUsed || "none",
      simulateHuman: !!simulateHuman,
      humanProfile: humanProfile || "none",
      crawlerDepth: crawlerDepth || 1,
      maxLinks: maxLinks || 50,
      followExternal: !!followExternal,
      linksFound: 0,
      linksFailed: 0,
    };
    memoryDb.sessions.push(newSession);

    memoryDb.sessionSteps.push({ id: Date.now().toString() + "-1", sessionId: newSession.id, timestamp: Date.now(), message: "Resolving DNS...", status: "info" });
    
    setTimeout(() => {
      newSession.status = "passed";
      newSession.completedAt = Date.now();
      newSession.totalDuration = 2100;
      newSession.linksFound = 4;
      memoryDb.sessionSteps.push({ id: Date.now().toString() + "-2", sessionId: newSession.id, timestamp: Date.now() - 1000, message: "Page loaded. Executing JS.", status: "ok" });
      memoryDb.sessionSteps.push({ id: Date.now().toString() + "-3", sessionId: newSession.id, timestamp: Date.now(), message: "Session complete.", status: "ok" });
      
      memoryDb.detectedLinks.push({ id: Date.now().toString() + "-l1", sessionId: newSession.id, url: "/api/checkout", elementType: "button", elementLabel: "Checkout", httpStatus: 200, loadTimeMs: 45, state: "discovered" });
      memoryDb.detectedLinks.push({ id: Date.now().toString() + "-l2", sessionId: newSession.id, url: "https://docs.acmeprod.com", elementType: "a", elementLabel: "Docs", httpStatus: 200, loadTimeMs: 112, state: "discovered" });
    }, 2000);

    res.json(newSession);
  });

  app.get("/api/sessions", async (req, res) => {
    res.json(memoryDb.sessions.sort((a: any, b: any) => b.startedAt - a.startedAt));
  });

  app.get("/api/sessions/:id", async (req, res) => {
    const session = memoryDb.sessions.find((s: any) => s.id.toString() === req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });
    
    const steps = memoryDb.sessionSteps.filter((s: any) => s.sessionId.toString() === req.params.id).sort((a: any, b: any) => a.timestamp - b.timestamp);
    const links = memoryDb.detectedLinks.filter((l: any) => l.sessionId.toString() === req.params.id);
    
    res.json({ session, steps, links });
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
