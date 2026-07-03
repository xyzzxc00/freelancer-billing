-- 支出憑證照片：新增 Storage 私有 bucket + RLS，並在 transactions 記錄物件路徑

ALTER TABLE "transactions" ADD COLUMN "receiptUrl" TEXT;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'receipts',
  'receipts',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- 檔案路徑約定為 "{userId}/{檔名}"，用路徑第一段做 owner 隔離
CREATE POLICY "receipts_owner_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "receipts_owner_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "receipts_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
