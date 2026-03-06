
-- Fix permissive RLS on invitation_codes UPDATE
DROP POLICY "Authenticated can update codes" ON public.invitation_codes;
CREATE POLICY "Users can claim unused codes" ON public.invitation_codes 
  FOR UPDATE TO authenticated 
  USING (used_by IS NULL) 
  WITH CHECK (used_by = auth.uid());
