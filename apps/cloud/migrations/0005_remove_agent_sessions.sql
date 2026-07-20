ALTER TABLE experience_feedback DROP COLUMN IF EXISTS session_id;
ALTER TABLE experiences DROP COLUMN IF EXISTS session_id;
DROP TABLE IF EXISTS sessions;
