-- Fix security definer view warning by removing SECURITY DEFINER
-- Instead, create a regular view and control access via RLS on the underlying table

-- Drop the existing view
DROP VIEW IF EXISTS public.public_tracks;

-- The tracks table already has proper RLS policies
-- Anonymous users can already view published tracks via the existing policy:
-- "Users can view published tracks or their own"
-- So we don't need a separate view - the RLS handles security properly