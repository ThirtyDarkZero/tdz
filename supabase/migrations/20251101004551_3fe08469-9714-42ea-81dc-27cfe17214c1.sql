-- Step 2: Create manager_artists table and policies
CREATE TABLE IF NOT EXISTS public.manager_artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_id UUID NOT NULL,
  artist_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 15.00,
  contract_start_date DATE,
  contract_end_date DATE,
  UNIQUE(manager_id, artist_id)
);

-- Enable RLS
ALTER TABLE public.manager_artists ENABLE ROW LEVEL SECURITY;

-- Managers can view their artists
CREATE POLICY "Managers can view their artists"
ON public.manager_artists
FOR SELECT
TO authenticated
USING (
  manager_id = auth.uid() 
  OR artist_id = auth.uid()
);

-- Managers can add artists
CREATE POLICY "Managers can add artists"
ON public.manager_artists
FOR INSERT
TO authenticated
WITH CHECK (
  manager_id = auth.uid()
  AND has_role(auth.uid(), 'manager'::app_role)
);

-- Managers can update their artist relationships
CREATE POLICY "Managers can update their artists"
ON public.manager_artists
FOR UPDATE
TO authenticated
USING (manager_id = auth.uid());

-- Managers can remove artists
CREATE POLICY "Managers can remove artists"
ON public.manager_artists
FOR DELETE
TO authenticated
USING (manager_id = auth.uid());

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_manager_artists_manager_id ON public.manager_artists(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_artists_artist_id ON public.manager_artists(artist_id);