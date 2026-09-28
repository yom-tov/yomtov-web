import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  integer,
  real,
  timestamp,
  date,
  jsonb,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    institution: varchar("institution", { length: 200 }),
    emailVerified: boolean("email_verified").default(false).notNull(),
    emailVerificationToken: varchar("email_verification_token", { length: 64 }),
    emailVerificationExpires: timestamp("email_verification_expires"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    active: boolean("active").default(true).notNull(),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

export const contentPackages = pgTable(
  "content_packages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 80 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
    priceDisplay: varchar("price_display", { length: 50 }).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("packages_slug_idx").on(t.slug)],
);

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  muxAssetId: varchar("mux_asset_id", { length: 255 }).notNull(),
  muxPlaybackId: varchar("mux_playback_id", { length: 255 }).notNull(),
  durationSeconds: integer("duration_seconds"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  thumbnailTime: real("thumbnail_time").default(0),
  displayOrder: integer("display_order").default(0).notNull(),
  // Hidden videos are skipped on course pages, the dashboard and playback.
  hidden: boolean("hidden").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const packageVideos = pgTable(
  "package_videos",
  {
    packageId: uuid("package_id")
      .notNull()
      .references(() => contentPackages.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    displayOrder: integer("display_order").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.packageId, t.videoId] })],
);

export const userPurchases = pgTable(
  "user_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    packageId: uuid("package_id")
      .notNull()
      .references(() => contentPackages.id, { onDelete: "cascade" }),
    grantedBy: varchar("granted_by", { length: 100 }).default("admin").notNull(),
    grantedAt: timestamp("granted_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    revokedAt: timestamp("revoked_at"),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    paymentMethod: varchar("payment_method", { length: 50 }),
    paymentNote: text("payment_note"),
    adminNotes: text("admin_notes"),
  },
  (t) => [
    uniqueIndex("purchases_user_package_idx").on(t.userId, t.packageId),
  ],
);

export const videoProgress = pgTable(
  "video_progress",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: uuid("video_id")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    positionSeconds: real("position_seconds").notNull(),
    durationSeconds: real("duration_seconds"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.videoId] })],
);

export const userActivity = pgTable("user_activity", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  videoId: uuid("video_id").references(() => videos.id, { onDelete: "set null" }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 64 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Admin: system health & alerts
// ---------------------------------------------------------------------------

// One row per distinct problem (stable `key`, e.g. "vercel.deploy.dpl_123").
// Health runs upsert rows they still see and resolve the ones that vanished.
export const systemAlerts = pgTable(
  "system_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 200 }).notNull(),
    source: varchar("source", { length: 40 }).notNull(),
    severity: varchar("severity", { length: 20 }).$type<"critical" | "warning" | "info">().notNull(),
    title: varchar("title", { length: 300 }).notNull(),
    detail: text("detail"),
    actionHint: text("action_hint"),
    link: varchar("link", { length: 500 }),
    firstSeenAt: timestamp("first_seen_at").defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    acknowledgedAt: timestamp("acknowledged_at"),
    lastEmailedAt: timestamp("last_emailed_at"),
  },
  (t) => [uniqueIndex("system_alerts_key_idx").on(t.key)],
);

export const healthRuns = pgTable("health_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  ranAt: timestamp("ran_at").defaultNow().notNull(),
  trigger: varchar("trigger", { length: 20 }).notNull(), // cron | manual | visit
  results: jsonb("results").notNull(),
  durationMs: integer("duration_ms").notNull(),
});

// Owner-maintained details about each paid service (plan, cost, renewal date).
// `serviceId` matches an id in lib/admin/architecture.ts.
export const serviceAccounts = pgTable(
  "service_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    serviceId: varchar("service_id", { length: 40 }).notNull(),
    plan: varchar("plan", { length: 100 }),
    monthlyCost: varchar("monthly_cost", { length: 50 }),
    renewalDate: date("renewal_date"),
    remindDaysBefore: integer("remind_days_before").default(14).notNull(),
    accountHint: varchar("account_hint", { length: 200 }),
    notes: text("notes"),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("service_accounts_service_idx").on(t.serviceId)],
);

// ---------------------------------------------------------------------------
// Admin-editable site content (texts, lists, YouTube collections)
// ---------------------------------------------------------------------------

// Key/value store for editable site sections. `key` is a section id from
// lib/site-content/registry.ts; `value` holds only the fields the admin has
// changed — everything else falls back to the defaults in code.
export const siteContent = pgTable("site_content", {
  key: varchar("key", { length: 120 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const youtubeVideos = pgTable(
  "youtube_videos",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collection: varchar("collection", { length: 40 }).notNull(),
    youtubeId: varchar("youtube_id", { length: 20 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    isShort: boolean("is_short").default(false).notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    hidden: boolean("hidden").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [index("youtube_videos_collection_idx").on(t.collection, t.displayOrder)],
);
