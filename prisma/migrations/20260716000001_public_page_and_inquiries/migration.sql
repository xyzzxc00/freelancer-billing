-- 接案頁（/p/[slug]）與詢價表單

ALTER TABLE "profiles" ADD COLUMN "slug" TEXT;
ALTER TABLE "profiles" ADD COLUMN "bio" TEXT;
ALTER TABLE "profiles" ADD COLUMN "services" TEXT;

CREATE UNIQUE INDEX "profiles_slug_key" ON "profiles"("slug");

CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "inquiries_userId_idx" ON "inquiries"("userId");

ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "inquiries" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inquiries_owner" ON "inquiries"
  FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
