ALTER TABLE experiences
ADD COLUMN source_experience_id uuid REFERENCES experiences(id) ON DELETE SET NULL;

CREATE INDEX experiences_source_experience_idx
ON experiences (source_experience_id)
WHERE source_experience_id IS NOT NULL;
