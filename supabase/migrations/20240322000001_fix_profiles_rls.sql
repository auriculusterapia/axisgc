-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND (role = 'ADMIN' OR email = 'auriculusterapia@gmail.com')
  ) OR (auth.jwt() ->> 'email' = 'auriculusterapia@gmail.com');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix profiles RLS to allow admins to manage all profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
CREATE POLICY "Admins can manage all profiles" ON profiles
  FOR ALL 
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Function to allow admins to delete users from auth.users
CREATE OR REPLACE FUNCTION public.delete_user(user_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if the caller is an admin
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND (profiles.role = 'ADMIN' OR profiles.email = 'auriculusterapia@gmail.com')
  ) THEN
    DELETE FROM auth.users WHERE id = user_id;
  ELSE
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
