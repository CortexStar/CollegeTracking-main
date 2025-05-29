CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing books table if it exists
DROP TABLE IF EXISTS "books";

-- Recreate books table with proper UUID configuration
CREATE TABLE "books" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "title" VARCHAR(256) NOT NULL,
    "author" VARCHAR(256),
    "file_path" TEXT NOT NULL,
    "original_filename" VARCHAR(512) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(64) NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add a temporary UUID column
ALTER TABLE "books" ADD COLUMN temp_id UUID DEFAULT uuid_generate_v4();

-- Update the temporary column with new UUIDs
UPDATE "books" SET temp_id = uuid_generate_v4();

-- Drop the primary key constraint if it exists
ALTER TABLE "books" DROP CONSTRAINT IF EXISTS books_pkey;

-- Drop the old id column
ALTER TABLE "books" DROP COLUMN id;

-- Rename temp_id to id
ALTER TABLE "books" RENAME COLUMN temp_id TO id;

-- Add primary key constraint
ALTER TABLE "books" ADD PRIMARY KEY (id);

-- Set the default for future inserts
ALTER TABLE "books" ALTER COLUMN id SET DEFAULT uuid_generate_v4(); 