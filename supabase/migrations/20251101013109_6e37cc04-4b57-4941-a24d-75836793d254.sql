-- Create storage bucket for artist gallery photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('artist-gallery', 'artist-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create presaves table for track pre-releases
CREATE TABLE IF NOT EXISTS public.track_presaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  track_id UUID NOT NULL REFERENCES public.tracks(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL,
  presaved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN DEFAULT false,
  UNIQUE(user_id, track_id)
);

ALTER TABLE public.track_presaves ENABLE ROW LEVEL SECURITY;

-- Create artist gallery table
CREATE TABLE IF NOT EXISTS public.artist_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL,
  image_path TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies for track_presaves
CREATE POLICY "Users can presave tracks"
ON public.track_presaves
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their presaves"
ON public.track_presaves
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their presaves"
ON public.track_presaves
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Artists can view presaves for their tracks"
ON public.track_presaves
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tracks
  WHERE tracks.id = track_presaves.track_id
  AND tracks.user_id = auth.uid()
));

-- RLS Policies for artist_gallery
CREATE POLICY "Anyone can view artist gallery photos"
ON public.artist_gallery
FOR SELECT
USING (true);

CREATE POLICY "Artists can upload to their gallery"
ON public.artist_gallery
FOR INSERT
WITH CHECK (auth.uid() = artist_id);

CREATE POLICY "Artists can update their gallery"
ON public.artist_gallery
FOR UPDATE
USING (auth.uid() = artist_id);

CREATE POLICY "Artists can delete from their gallery"
ON public.artist_gallery
FOR DELETE
USING (auth.uid() = artist_id);

-- Storage policies for artist-gallery bucket
CREATE POLICY "Anyone can view artist gallery images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'artist-gallery');

CREATE POLICY "Artists can upload gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'artist-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can update their gallery images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'artist-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artists can delete their gallery images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'artist-gallery' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Trigger for updated_at on artist_gallery
CREATE TRIGGER update_artist_gallery_updated_at
BEFORE UPDATE ON public.artist_gallery
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();