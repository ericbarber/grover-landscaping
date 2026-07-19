ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS primary_contact_name TEXT;

ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS contact_email TEXT;

ALTER TABLE customer_accounts
    ADD COLUMN IF NOT EXISTS contact_phone TEXT;

UPDATE customer_accounts
SET primary_contact_name = customer_name,
    contact_email = 'customer@example.com'
WHERE id IN ('acct_1001', 'acct_1002')
  AND primary_contact_name IS NULL
  AND contact_email IS NULL
  AND contact_phone IS NULL;
