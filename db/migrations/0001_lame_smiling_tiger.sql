ALTER TABLE "books" ALTER COLUMN "id" SET DATA TYPE uuid;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "title" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "author" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "author" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "books" ALTER COLUMN "is_built_in" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "file_path" text NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "original_filename" varchar(512) NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "file_size" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "mime_type" varchar(64) NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "books" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "stored_name";--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "original_name";--> statement-breakpoint
ALTER TABLE "books" DROP COLUMN "uploaded_at";