ALTER TABLE owner_provider_disclosure_receipts
    ADD COLUMN IF NOT EXISTS review_version TEXT;

UPDATE owner_provider_disclosure_receipts
SET review_version = 'legacy_disclosure_review'
WHERE review_version IS NULL;

ALTER TABLE owner_provider_disclosure_receipts
    ALTER COLUMN review_version SET NOT NULL;
