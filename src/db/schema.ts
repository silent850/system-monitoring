import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").unique().notNull(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("admin").notNull(), // 'admin', 'manager', 'viewer'
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  billingPlan: text("billing_plan").default("free"), // 'free', 'pro', 'enterprise'
  createdAt: timestamp("created_at").defaultNow(),
});

export const monitors = pgTable("monitors", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").references(() => companies.id),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: text("type").notNull(), // 'site', 'page', 'api'
  status: text("status").default("paused"), // 'up', 'down', 'paused'
  checkInterval: integer("check_interval").default(60), // seconds
  crawlerEnabled: boolean("crawler_enabled").default(false),
  crawlerDepth: integer("crawler_depth").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").references(() => monitors.id),
  status: text("status").notNull(),
  loadTimeMs: integer("load_time_ms"),
  responseCode: integer("response_code"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const proxies = pgTable("proxies", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  address: text("address").notNull(), // e.g., IP:PORT:USER:PASS
  status: text("status").default("healthy"),
  groupId: integer("group_id"),
  lastUsedAt: timestamp("last_used_at"),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  monitorId: integer("monitor_id").references(() => monitors.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  status: text("status").default("running"), // running, passed, failed
  proxyUsed: text("proxy_used"),
  userAgent: text("user_agent"),
  simulateHuman: boolean("simulate_human").default(false),
  humanProfile: text("human_profile"), // none, light, moderate
  crawlerDepth: integer("crawler_depth").default(1),
  maxLinks: integer("max_links").default(50),
  followExternal: boolean("follow_external").default(false),
  totalDuration: integer("total_duration_ms"),
  linksFound: integer("links_found").default(0),
  linksFailed: integer("links_failed").default(0),
});

export const sessionSteps = pgTable("session_steps", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  timestamp: timestamp("timestamp").defaultNow(),
  message: text("message").notNull(),
  status: text("status").default("ok"), // ok, info, fail
  durationMs: integer("duration_ms"),
});

export const detectedLinks = pgTable("detected_links", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id),
  url: text("url").notNull(),
  elementType: text("element_type").notNull(), // a, button, img
  elementLabel: text("element_label"),
  httpStatus: integer("http_status"),
  loadTimeMs: integer("load_time_ms"),
  state: text("state").default("discovered"), // discovered, ignored, blocked
});
