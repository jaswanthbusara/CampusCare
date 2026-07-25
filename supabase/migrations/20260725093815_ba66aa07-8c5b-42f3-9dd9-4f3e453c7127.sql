
CREATE POLICY "Authenticated can read lost-found images"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lost-found-images');

CREATE POLICY "Users upload own lost-found images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'lost-found-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own lost-found images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'lost-found-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own lost-found images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'lost-found-images' AND auth.uid()::text = (storage.foldername(name))[1]);
