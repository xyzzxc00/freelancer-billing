-- 報價單合約條款：付款條件、修改次數上限、交付時程等，客戶接受報價視為一併同意

ALTER TABLE "quotes" ADD COLUMN "terms" TEXT;
