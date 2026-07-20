ALTER TABLE users ADD COLUMN username text;
ALTER TABLE users ADD COLUMN email text;
ALTER TABLE users ADD COLUMN password_hash text;

UPDATE users
SET username = COALESCE(
  github_username,
  'legacy_' || replace(id::text, '-', '')
);

CREATE UNIQUE INDEX users_username_lower_idx ON users (lower(username));
CREATE UNIQUE INDEX users_email_lower_idx ON users (lower(email)) WHERE email IS NOT NULL;

DROP TABLE IF EXISTS oauth_states;
