import { pgTable, text, serial, integer, boolean, timestamp, jsonb, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const books = pgTable("books", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  author: text("author").default(""),
  filePath: text("file_path").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileSize: bigint("file_size", { mode: "number" }).notNull().default(0),
  mimeType: text("mime_type").default("application/pdf").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  isActive: boolean("is_active").default(true).notNull(),
  metadataJson: jsonb("metadata_json").default({}).notNull(),
  isBuiltIn: boolean("is_built_in").default(false).notNull(),
});

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

export const insertBookSchema = createInsertSchema(books, {
  author: z.string().optional(),
  fileSize: z.number().positive().optional(),
  metadataJson: z.record(z.any()).optional(),
}).omit({
  id: true,
  uploadedAt: true,
  updatedAt: true,
  isActive: true,
  isBuiltIn: true,
  mimeType: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
