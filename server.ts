import express from "express";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // In-memory pseudo DB for prototype
  const db = {
    settings: {
      systemName: "Uptime Pulse",
      logo: "",
      installed: false,
    },
    monitors: [
      { id: 1, name: "API Production", url: "https://api.example.com/health", type: "api", status: "up", lastChecked: Date.now(), avgLoadTime: 120, company: "Acme Corp" },
      { id: 2, name: "Marketing Site", url: "https://example.com", type: "site", status: "down", lastChecked: Date.now(), avgLoadTime: 850, company: "Acme Corp" }
    ],
    logs: []
  };

  // API Routes
  
  // Health
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Installer
  app.get("/api/system/status", (req, res) => {
    res.json({ installed: db.settings.installed, systemName: db.settings.systemName });
  });

  app.post("/api/system/install", (req, res) => {
    const { systemName, dbUrl, adminEmail } = req.body;
    db.settings.systemName = systemName || "Monitrix";
    db.settings.installed = true;
    res.json({ success: true, message: "System installed." });
  });

  // Monitors
  app.get("/api/monitors", (req, res) => {
    res.json(db.monitors);
  });

  // SonicPesa Webhook & create order simulation
  app.post("/api/v1/payment/create_order", (req, res) => {
    // Simulated SonicPesa response
    res.json({
      status: "success",
      message: "Payment order created successfully! Push USSD sent to your phone.",
      data: {
        order_id: "sp_" + Math.random().toString(36).substring(7),
        amount: req.body.amount,
        payment_status: "PENDING"
      }
    });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
