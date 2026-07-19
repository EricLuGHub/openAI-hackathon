ALTER TABLE experiences ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
ALTER TABLE experiences ADD COLUMN actor_user_id uuid REFERENCES users(id);
ALTER TABLE experiences ADD COLUMN token_id uuid REFERENCES personal_access_tokens(id);
ALTER TABLE experience_feedback ADD COLUMN workspace_id uuid REFERENCES workspaces(id);
ALTER TABLE experience_feedback ADD COLUMN actor_user_id uuid REFERENCES users(id);
ALTER TABLE experience_feedback ADD COLUMN token_id uuid REFERENCES personal_access_tokens(id);

DO $$
DECLARE
  legacy_user_id uuid := gen_random_uuid();
  repository_value text;
  legacy_workspace_id uuid;
BEGIN
  INSERT INTO users (id, display_name, status)
  VALUES (legacy_user_id, 'Legacy local user', 'active');

  FOR repository_value IN
    SELECT repository FROM experiences
    UNION
    SELECT 'local/repository'
  LOOP
    legacy_workspace_id := gen_random_uuid();
    INSERT INTO workspaces (
      id, created_by_user_id, owner_user_id, canonical_key, provider,
      repository_owner, repository_name, remote_url, visibility
    ) VALUES (
      legacy_workspace_id, legacy_user_id, legacy_user_id,
      CASE WHEN repository_value LIKE 'github:%' THEN repository_value ELSE 'legacy:' || repository_value END,
      CASE WHEN repository_value LIKE 'github:%' THEN 'github' ELSE 'local' END,
      split_part(repository_value, '/', 1), split_part(repository_value, '/', 2),
      repository_value, 'discoverable'
    );
    INSERT INTO workspace_memberships (workspace_id, user_id, role, granted_by_user_id)
    VALUES (legacy_workspace_id, legacy_user_id, 'owner', legacy_user_id);
  END LOOP;

  UPDATE experiences experience
  SET workspace_id = workspace.id, actor_user_id = legacy_user_id
  FROM workspaces workspace
  WHERE workspace.canonical_key = CASE
    WHEN experience.repository LIKE 'github:%' THEN experience.repository
    ELSE 'legacy:' || experience.repository
  END;

  UPDATE experience_feedback feedback
  SET workspace_id = experience.workspace_id, actor_user_id = legacy_user_id
  FROM experiences experience
  WHERE feedback.experience_id = experience.id;
END $$;

ALTER TABLE experiences ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE experiences ALTER COLUMN actor_user_id SET NOT NULL;
ALTER TABLE experience_feedback ALTER COLUMN workspace_id SET NOT NULL;
ALTER TABLE experience_feedback ALTER COLUMN actor_user_id SET NOT NULL;

CREATE INDEX experiences_workspace_status_type_idx ON experiences (workspace_id, status, type);
CREATE INDEX feedback_workspace_experience_idx ON experience_feedback (workspace_id, experience_id);
