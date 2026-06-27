-- Index on quotes.status for list filtering
CREATE INDEX IF NOT EXISTS "Quote_status_idx" ON "quotes"("status");

-- Index on quotes.sentAt for stale-quotes cron
CREATE INDEX IF NOT EXISTS "Quote_sentAt_idx" ON "quotes"("sentAt");
