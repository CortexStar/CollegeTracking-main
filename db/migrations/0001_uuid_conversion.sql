ALTER TABLE "books"
    ALTER COLUMN "id" SET DATA TYPE uuid
        USING ("id"::uuid),
    ALTER COLUMN "id" SET DEFAULT gen_random_uuid(); 