ALTER TABLE organization_memberships
    ADD COLUMN IF NOT EXISTS display_name TEXT;

UPDATE organization_memberships
SET display_name = CASE
    WHEN user_id = 'local-development-user' THEN 'Local Development Owner'
    WHEN user_id LIKE '%@%' THEN user_id
    ELSE user_id
END
WHERE display_name IS NULL OR btrim(display_name) = '';
