import { db, pool } from "./index";
import { users, books, insertUserSchema } from "../shared/schema";
import * as argon2 from "argon2";

// Helper function to hash passwords
async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    hashLength: 32,
  });
}

async function seed() {
  try {
    console.log("🌱 Starting seed process...");

    // Add an admin user (with idempotence using onConflictDoNothing)
    const adminPassword = await hashPassword("admin123");
    const adminUser = await db.insert(users)
      .values({
        username: "admin",
        email: "admin@example.com",
        name: "Administrator",
        password: adminPassword
      })
      .onConflictDoNothing({ target: users.username })
      .returning();
    
    console.log(`👤 Admin user ${adminUser.length ? 'created' : 'already exists'}`);

    // Add a demo user
    const demoPassword = await hashPassword("demo123");
    const demoUser = await db.insert(users)
      .values({
        username: "demo",
        email: "demo@example.com",
        name: "Demo User",
        password: demoPassword
      })
      .onConflictDoNothing({ target: users.username })
      .returning();
    
    console.log(`👤 Demo user ${demoUser.length ? 'created' : 'already exists'}`);

    // Add some sample built-in books (also using onConflictDoNothing)
    const sampleBooks = [
      {
        id: "built-in-linear-algebra",
        userId: "system",
        title: "Introduction to Linear Algebra",
        author: "Gilbert Strang",
        storedName: "linear-algebra-sample.pdf",
        originalName: "Introduction to Linear Algebra.pdf",
        isBuiltIn: true
      }
    ];

    for (const book of sampleBooks) {
      const result = await db.insert(books)
        .values(book)
        .onConflictDoNothing({ target: books.id })
        .returning();
      
      console.log(`📚 Book "${book.title}" ${result.length ? 'added' : 'already exists'}`);
    }

    console.log("✅ Seed process completed successfully");
  } catch (error) {
    console.error("❌ Seed process failed:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Execute the seed function
seed();
