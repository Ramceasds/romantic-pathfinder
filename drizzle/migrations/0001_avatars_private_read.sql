DROP POLICY IF EXISTS "Avatars are public" ON storage.objects;
CREATE POLICY "Signed-in users view avatars" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'avatars');