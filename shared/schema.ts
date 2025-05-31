// shared/schema.ts
import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  uuid,
  serial,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";

/* ───────────────────────────────── USERS TABLE ───────────────────────────── */

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/* ───────────────────────────────── BOOKS TABLE ───────────────────────────── */

export const books = pgTable("books", {
  id: uuid("id").primaryKey().defaultRandom(), // UUID PK with default
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").default(""),
  filePath: text("file_path").notNull(),
  originalFilename: varchar("original_filename", { length: 512 }).notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  isActive: boolean("is_active").default(true),
  isBuiltIn: boolean("is_built_in").default(false).notNull(),
});

/* ───────────────────────────── ZOD INSERT SCHEMAS ────────────────────────── */

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    email: true,
    name: true,
  })
  .extend({
    email: z.string().email().optional(),
    name: z.string().min(2).optional(),
    username: z.string().min(3).max(50),
    password: z.string().min(6),
  });

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

/* ──────────────────────────── INFERRED TYPE ALIASES ─────────────────────── */


export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

export type SelectBook = InferSelectModel<typeof books>;
export type InsertBook = InferInsertModel<typeof books>;
