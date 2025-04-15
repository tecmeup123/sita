import { pgTable, text, serial, boolean, varchar, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Admin wallet functionality has been removed

// Content items like terms and conditions, about text, etc.
export const contentItems = pgTable("content_items", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  network: varchar("network", { length: 10 }).notNull().default("testnet"),
  updated_at: timestamp("updated_at").defaultNow(),
  updated_by: text("updated_by"),
});

export const insertContentItemSchema = createInsertSchema(contentItems).pick({
  key: true,
  title: true,
  content: true,
  language: true,
  network: true,
  updated_by: true,
});

// FAQ items for the FAQ bot
export const faqCategories = pgTable("faq_categories", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  network: varchar("network", { length: 10 }).notNull().default("testnet"),
  order: serial("order").notNull(),
});

export const insertFaqCategorySchema = createInsertSchema(faqCategories).pick({
  title: true,
  language: true,
  network: true,
  order: true,
});

export const faqItems = pgTable("faq_items", {
  id: serial("id").primaryKey(),
  category_id: serial("category_id").references(() => faqCategories.id, { onDelete: 'cascade' }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  keywords: text("keywords").array().notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  network: varchar("network", { length: 10 }).notNull().default("testnet"),
  order: serial("order").notNull(),
});

export const insertFaqItemSchema = createInsertSchema(faqItems).pick({
  category_id: true,
  question: true,
  answer: true,
  keywords: true,
  language: true,
  network: true,
  order: true,
});

// Partner promotions
export const partnerPromotions = pgTable("partner_promotions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  short_description: text("short_description"),
  logo_text: varchar("logo_text", { length: 10 }),
  logo_background: varchar("logo_background", { length: 20 }),
  logo_color: varchar("logo_color", { length: 20 }),
  link_url: text("link_url").notNull(),
  link_text: text("link_text").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  network: varchar("network", { length: 10 }).notNull().default("testnet"),
  active: boolean("active").notNull().default(true),
  order: serial("order").notNull(),
});

export const insertPartnerPromotionSchema = createInsertSchema(partnerPromotions).pick({
  name: true,
  description: true,
  short_description: true,
  logo_text: true,
  logo_background: true,
  logo_color: true,
  link_url: true,
  link_text: true,
  language: true,
  network: true,
  active: true,
  order: true,
});

// App settings and configuration
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 50 }).notNull().unique(),
  value: jsonb("value"),
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertAppSettingSchema = createInsertSchema(appSettings).pick({
  key: true,
  value: true,
});

// Export all the types
// Admin wallet types have been removed

export type InsertContentItem = z.infer<typeof insertContentItemSchema>;
export type ContentItem = typeof contentItems.$inferSelect;

export type InsertFaqCategory = z.infer<typeof insertFaqCategorySchema>;
export type FaqCategory = typeof faqCategories.$inferSelect;

export type InsertFaqItem = z.infer<typeof insertFaqItemSchema>;
export type FaqItem = typeof faqItems.$inferSelect;

export type InsertPartnerPromotion = z.infer<typeof insertPartnerPromotionSchema>;
export type PartnerPromotion = typeof partnerPromotions.$inferSelect;

export type InsertAppSetting = z.infer<typeof insertAppSettingSchema>;
export type AppSetting = typeof appSettings.$inferSelect;

// Security events table for audit trail
export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  event_type: varchar("event_type", { length: 50 }).notNull(),
  message: text("message").notNull(),
  user_id: serial("user_id").references(() => users.id, { onDelete: 'set null' }),
  wallet_address: varchar("wallet_address", { length: 255 }),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  resource_type: varchar("resource_type", { length: 50 }),
  resource_id: text("resource_id"),
  request_data: jsonb("request_data"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  severity: varchar("severity", { length: 20 }).notNull().default("info"),
  network: varchar("network", { length: 10 }).notNull().default("testnet"),
}, (table) => {
  return {
    eventTypeIdx: index("security_events_event_type_idx").on(table.event_type),
    walletAddressIdx: index("security_events_wallet_address_idx").on(table.wallet_address),
    createdAtIdx: index("security_events_created_at_idx").on(table.created_at),
    severityIdx: index("security_events_severity_idx").on(table.severity),
  };
});

export const insertSecurityEventSchema = createInsertSchema(securityEvents).pick({
  event_type: true,
  message: true,
  user_id: true,
  wallet_address: true,
  ip_address: true,
  user_agent: true,
  resource_type: true,
  resource_id: true,
  request_data: true,
  severity: true,
  network: true,
});

export type InsertSecurityEvent = z.infer<typeof insertSecurityEventSchema>;
export type SecurityEvent = typeof securityEvents.$inferSelect;
