-- TEMPORARY: Disable RLS for testing
-- Run this to get the app working, then we'll add proper policies

-- Disable RLS completely
ALTER TABLE public.academic_records DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can insert own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can update own records" ON public.academic_records;
DROP POLICY IF EXISTS "Users can delete own records" ON public.academic_records;
DROP POLICY IF EXISTS "Student admin can view all" ON public.academic_records;
DROP POLICY IF EXISTS "Service role has full access" ON public.academic_records;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'academic_records';
-- rowsecurity should be 'false'
