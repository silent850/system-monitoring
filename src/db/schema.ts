import { integer, pgTable, serial, text, timestamp, boolean, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'Admin', 'User'
});

export const permissions = pgTable('permissions', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(), // e.g., 'manage_system', 'manage_monitors'
});

export const userRoles = pgTable('user_roles', {
  userId: text('user_id').notNull().references(() => users.id),
  roleId: text('role_id').notNull().references(() => roles.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

export const rolePermissions = pgTable('role_permissions', {
  roleId: text('role_id').notNull().references(() => roles.id),
  permissionId: text('permission_id').notNull().references(() => permissions.id),
}, (t) => ({
  pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
}));

export const systemSettings = pgTable('system_settings', {
  id: text('id').primaryKey(), // 'main'
  systemName: text('system_name').default('UptimeMonitor'),
  companyName: text('company_name').default(''),
  logoUrl: text('logo_url'),
  faviconUrl: text('favicon_url'),
  supportEmail: text('support_email'),
  timezone: text('timezone').default('UTC'),
  isInstalled: boolean('is_installed').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const smtpSettings = pgTable('smtp_settings', {
  id: text('id').primaryKey(), // 'main'
  host: text('host'),
  port: integer('port'),
  username: text('username'),
  password: text('password'),
  encryption: text('encryption'), // 'tls', 'ssl', 'none'
  fromEmail: text('from_email'),
  fromName: text('from_name'),
});

export const paymentGateways = pgTable('payment_gateways', {
  id: text('id').primaryKey(), // 'sonicpesa'
  name: text('name'),
  accessKey: text('access_key'),
  secretKey: text('secret_key'),
  webhookSecret: text('webhook_secret'),
  environment: text('environment').default('sandbox'), // 'sandbox' or 'production'
  isActive: boolean('is_active').default(false),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  planId: text('plan_id'),
  status: text('status'), // 'active', 'canceled', 'past_due'
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const monitors = pgTable('monitors', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  name: text('name').notNull(),
  url: text('url').notNull(),
  intervalSeconds: integer('interval_seconds').default(60),
  isActive: boolean('is_active').default(true),
  crawlEnabled: boolean('crawl_enabled').default(false),
  crawlDepth: integer('crawl_depth').default(1),
  createdAt: timestamp('created_at').defaultNow(),
});

export const proxyGroups = pgTable('proxy_groups', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const proxies = pgTable('proxies', {
  id: text('id').primaryKey(),
  groupId: text('group_id').references(() => proxyGroups.id),
  url: text('url').notNull(),
  isActive: boolean('is_active').default(true),
  lastStatus: text('last_status'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const uptimeChecks = pgTable('uptime_checks', {
  id: text('id').primaryKey(),
  monitorId: text('monitor_id').notNull().references(() => monitors.id),
  status: text('status').notNull(), // 'up' or 'down'
  responseTime: integer('response_time'),
  errorDetails: text('error_details'),
  proxyUsed: text('proxy_used'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const browserSessions = pgTable('browser_sessions', {
  id: text('id').primaryKey(),
  monitorId: text('monitor_id').notNull().references(() => monitors.id),
  status: text('status'),
  startTime: timestamp('start_time').defaultNow(),
  endTime: timestamp('end_time'),
});

export const browserSteps = pgTable('browser_steps', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => browserSessions.id),
  stepName: text('step_name'),
  screenshotUrl: text('screenshot_url'),
  status: text('status'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const crawledLinks = pgTable('crawled_links', {
  id: text('id').primaryKey(),
  monitorId: text('monitor_id').references(() => monitors.id),
  parentUrl: text('parent_url').notNull(),
  href: text('href').notNull(),
  linkText: text('link_text'),
  isStatic: boolean('is_static').default(false),
  isDynamic: boolean('is_dynamic').default(false),
  lastChecked: text('last_checked'),
  lastStatus: text('last_status').default('pending'),
  responseTime: integer('response_time'),
  isBlocked: boolean('is_blocked').default(false),
  depth: integer('depth').default(1),
});

export const crawlLogs = pgTable('crawl_logs', {
  id: text('id').primaryKey(),
  crawledLinkId: text('crawled_link_id').references(() => crawledLinks.id),
  status: text('status'),
  responseTime: integer('response_time'),
  errorDetails: text('error_details'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  companyId: text('company_id').references(() => companies.id),
  monitorId: text('monitor_id').references(() => monitors.id),
  type: text('type'), // 'email', 'webhook'
  recipient: text('recipient'),
  message: text('message'),
  status: text('status'), // 'sent', 'failed'
  timestamp: timestamp('timestamp').defaultNow(),
});

// Legacy backward compatibility (Config)
export const config = pgTable('config', {
  id: text('id').primaryKey(),
  urls: jsonb('urls').default([]),
  proxies: jsonb('proxies').default([]),
  email: text('email').default(''),
  intervalSeconds: integer('interval_seconds').default(60),
  blockedLinks: jsonb('blocked_links').default([]),
  crawlEnabled: boolean('crawl_enabled').default(false),
  crawlDepth: integer('crawl_depth').default(1),
});

export const uptimeLogs = pgTable('uptime_logs', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  status: text('status').notNull(),
  timestamp: text('timestamp').notNull(),
  responseTime: integer('response_time'),
  errorDetails: text('error_details'),
  proxyUsed: text('proxy_used'),
  isSubLink: boolean('is_sub_link').default(false),
  parentUrl: text('parent_url'),
});

