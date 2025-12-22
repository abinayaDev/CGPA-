-- SQL Query to add academic_year column
ALTER TABLE public.academic_records
ADD COLUMN academic_year INTEGER;

-- Optional: Update existing records based on semester (assuming typical 2 sem/year pattern)
-- Year 1: Sem 1, 2
-- Year 2: Sem 3, 4
-- Year 3: Sem 5, 6
-- Year 4: Sem 7, 8

UPDATE public.academic_records
SET academic_year = CEIL(semester / 2.0);
