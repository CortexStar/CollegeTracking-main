import { pgTable, text, serial, integer, boolean, timestamp, jsonb, bigint, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { InferModel } from "drizzle-orm";

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
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true),
  isBuiltIn: boolean("is_built_in").default(false),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export const insertBookSchema = createInsertSchema(books)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = InferModel<typeof users, "select">;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type SelectBook = InferModel<typeof books, "select">;
