UPDATE customer_accounts
SET email_notifications_enabled = TRUE
WHERE id IN ('acct_1001', 'acct_1002')
  AND contact_email IS NOT NULL;
