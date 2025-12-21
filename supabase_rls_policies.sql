-- CGPA Predictor - Final RLS Policies (No auth.users dependency)
-- Run this in Supabase SQL Editor

-- Clean up existing policies
DROP POLICY IF EXISTS "Users can view own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can update own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can delete own records" ON public.academic_records;
DROP POLICY IF EXISTS "Student admin can view all" ON public.academic_records;
DROP POLICY IF EXISTS "Service role has full access" ON public.academic_records;

-- Enable RLS
ALTER TABLE public.academic_records ENABLE ROW LEVEL SECURITY;

-- Policy 1: Service role (backend) has full access
CREATE POLICY "Service role has full access"
ON public.academic_records
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 2: Users can view their own records
CREATE POLICY "Users can view own records"
ON public.academic_records
FOR SELECT
TO authenticated, anon
USING (user_id::text = (auth.uid())::text);

-- Policy 3: Student admin can view all (simplified - no auth.users lookup)
-- Note: This uses auth.email() which is available without querying auth.users
CREATE POLICY "Student admin can view all"
ON public.academic_records
FOR SELECT
TO authenticated, anon
USING (
  COALESCE(auth.email(), '') = 'studentit@gmail.com'
);

-- Verify
SELECT tablename, policyname, roles 
FROM pg_policies 
WHERE tablename = 'academic_records';
