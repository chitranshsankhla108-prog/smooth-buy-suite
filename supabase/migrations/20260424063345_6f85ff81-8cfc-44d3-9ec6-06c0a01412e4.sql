DROP POLICY IF EXISTS "Admins update dealer profiles" ON public.profiles;
CREATE POLICY "Admins update dealer profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));