CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS experiences (
  id uuid PRIMARY KEY,
  type text NOT NULL,
  repository text NOT NULL DEFAULT 'local/repository',
  task_summary text NOT NULL,
  summary text NOT NULL,
  detail text,
  steps text[] NOT NULL DEFAULT '{}',
  paths text[] NOT NULL DEFAULT '{}',
  services text[] NOT NULL DEFAULT '{}',
  tools text[] NOT NULL DEFAULT '{}',
  error_signatures text[] NOT NULL DEFAULT '{}',
  keywords text[] NOT NULL DEFAULT '{}',
  related_terms text[] NOT NULL DEFAULT '{}',
  aliases text[] NOT NULL DEFAULT '{}',
  evidence jsonb NOT NULL DEFAULT '[]',
  outcome_status text NOT NULL DEFAULT 'unknown',
  tests text[] NOT NULL DEFAULT '{}',
  revision text NOT NULL,
  confidence text NOT NULL DEFAULT 'observed',
  status text NOT NULL DEFAULT 'current',
  successful_uses integer NOT NULL DEFAULT 0,
  failed_uses integer NOT NULL DEFAULT 0,
  usefulness_score double precision NOT NULL DEFAULT 0.5,
  ranking_score double precision NOT NULL DEFAULT 0.5,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_revised_at timestamptz NOT NULL DEFAULT now(),
  last_validated_at timestamptz NOT NULL DEFAULT now(),
  ranking_calculated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS experiences_keywords_idx ON experiences USING gin(keywords);
CREATE INDEX IF NOT EXISTS experiences_services_idx ON experiences USING gin(services);
CREATE INDEX IF NOT EXISTS experiences_paths_idx ON experiences USING gin(paths);
CREATE INDEX IF NOT EXISTS experiences_errors_idx ON experiences USING gin(error_signatures);
CREATE INDEX IF NOT EXISTS experiences_status_idx ON experiences(status, type);

CREATE TABLE IF NOT EXISTS experience_feedback (
  id uuid PRIMARY KEY,
  experience_id uuid NOT NULL REFERENCES experiences(id) ON DELETE CASCADE,
  relevant boolean NOT NULL,
  still_valid boolean NOT NULL,
  outcome text NOT NULL,
  evidence text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedback_experience_idx ON experience_feedback(experience_id);
