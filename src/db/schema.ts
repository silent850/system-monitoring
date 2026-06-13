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
