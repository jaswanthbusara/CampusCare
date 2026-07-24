CREATE POLICY "Users upload to own folder" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'complaint-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users read own complaint images" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'complaint-images' AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR public.has_role(auth.uid(), 'staff')
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'teacher')
  ));
CREATE POLICY "Users delete own complaint images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'complaint-images' AND (
    (storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')
  ));