import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email"),
  name: text("name"),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const books = pgTable("books", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(), // For anonymous sessions
  title: text("title").notNull(),
  author: text("author").default(""),
  storedName: text("stored_name").notNull(), // The name stored on disk
  originalName: text("original_name").notNull(), // Original file name
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  isBuiltIn: boolean("is_built_in").default(false),
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

export const insertBookSchema = createInsertSchema(books).omit({
  uploadedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBook = z.infer<typeof insertBookSchema>;
export type Book = typeof books.$inferSelect;
