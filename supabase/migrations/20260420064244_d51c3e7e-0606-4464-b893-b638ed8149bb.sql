
-- Restrict listing on qr-codes bucket: keep public read of individual files, but prevent enumeration via name pattern
DROP POLICY "Public read qr codes" ON storage.objects;

-- Public can read only files in 'public/' folder (we'll upload there); anonymous LIST attempts return empty
CREATE POLICY "Public read qr-codes public folder" ON storage.objects
FOR SELECT
USING (bucket_id = 'qr-codes' AND (storage.foldername(name))[1] = 'public');
