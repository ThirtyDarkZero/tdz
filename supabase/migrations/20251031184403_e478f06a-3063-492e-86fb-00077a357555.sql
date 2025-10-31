-- Add unique constraint on project_id for tempo_maps table
ALTER TABLE tempo_maps ADD CONSTRAINT tempo_maps_project_id_key UNIQUE (project_id);