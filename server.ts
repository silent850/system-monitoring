import express from "express";
import path from "path";
import crypto from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

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
    console.log("No DATABASE_URL found, running in limited memory mode (installer enabled)...");
  }

  // Use raw body for webhook verification
  app.use(express.json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    }
  }));

  // In-memory pseudo DB fallback for testing / installer mode before DB exists
  const memoryDb: any = {
    settings: {
      systemName: "Uptime Pulse",
      logo: "",
      installed: dbUrl ? true : false,
      sonicPesaKey: process.env.SONICPESA_API_KEY || "",
      sonicPesaSecret: process.env.SONICPESA_API_SECRET || "",
    },
    monitors: [
      { id: 1, name: "API Production", url: "https://api.example.com/health", type: "api", status: "up", lastChecked: Date.now(), avgLoadTime: 120, company: "Acme Corp" },
      { id: 2, name: "Marketing Site", url: "https://example.com", type: "site", status: "down", lastChecked: Date.now(), avgLoadTime: 850, company: "Acme Corp" }
    ],
    logs: [],
    sessions: [],
    sessionSteps: [],
    detectedLinks: []
  };

  // API Routes
  
  // Health
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Installer
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

  // Monitors
  app.get("/api/monitors", async (req, res) => {
    if (db) {
       // Assuming it's seeded, return empty or fetch real when we have full schema imports
       // For now just return memory payload as mock
    }
    res.json(memoryDb.monitors);
  });

  // Real SonicPesa integration proxy
  app.post("/api/v1/payment/create_order", async (req, res) => {
    const { amount, phone, currency, email, name } = req.body;
    const apiKey = memoryDb.settings.sonicPesaKey || process.env.SONICPESA_API_KEY;

    if (!apiKey) {
      return res.status(401).json({ status: "error", message: "SonicPesa API Key not configured" });
    }

    try {
      // Connect to production SonicPesa API correctly
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

  // Real SonicPesa Polling integration
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

  // Real Webhook listener for SonicPesa
  app.post("/api/webhooks/sonicpesa", (req: any, res: any) => {
    const signature = req.headers["x-sonicpesa-signature"];
    const apiSecret = memoryDb.settings.sonicPesaSecret || process.env.SONICPESA_API_SECRET;

    if (!apiSecret) {
      return res.status(500).send("Webhook secret not configured.");
    }

    if (!signature) {
      return res.status(400).send("No signature block found");
    }

    // HMAC Signature Validation
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
      // In a real app we update the DB invoice/subscription record here
    }

    res.status(200).send("Webhook received");
  });

  app.get("/api/transactions", async (req, res) => {
    // List transactions mock or pass-through
    res.json({
        "status": "success",
        "data": []
    });
  });

  // --- Live Activity / Crawler API Routes ---
  app.get("/api/monitors/:id", async (req, res) => {
    // Real implementation would query DB. In-memory fallback:
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

    // Mock immediate steps
    memoryDb.sessionSteps.push({ id: Date.now().toString() + "-1", sessionId: newSession.id, timestamp: Date.now(), message: "Resolving DNS...", status: "info" });
    
    // Simulate finishing after 2 seconds
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

  // Wait for Vite to load lazily to speed up cold starts
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to avoid early require issues
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
