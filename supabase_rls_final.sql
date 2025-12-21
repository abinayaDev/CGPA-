-- CGPA Predictor - Final Correct RLS Policies (UUID Type Fixed)
-- Run this in your Supabase SQL Editor.

-- 1. Reset: Drop all existing policies
DROP POLICY IF EXISTS "Users can view own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can update own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can delete own records" ON public.academic_records;
DROP POLICY IF EXISTS "Student admin can view all" ON public.academic_records;
DROP POLICY IF EXISTS "Service role has full access" ON public.academic_records;
DROP POLICY IF EXISTS "Users can manage own records" ON public.academic_records;

-- 2. Ensure RLS is ENABLED
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Service Role (Backend) has Full Access
CREATE POLICY "Service role has full access"
ON public.academic_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Policy: Authenticated Users can Manage their OWN records
-- Removed ::text casting because user_id is UUID type
CREATE POLICY "Users can manage own records"
ON public.academic_records
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Policy: "Student IT" Admin can View ALL records
CREATE POLICY "Student admin can view all"
ON public.academic_records
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'email') = 'studentit@gmail.com'
);

-- 6. Verification
SELECT tablename, policyname, roles, cmd 
FROM pg_policies 
WHERE tablename = 'academic_records';
