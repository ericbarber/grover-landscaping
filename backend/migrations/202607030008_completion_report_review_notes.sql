CREATE TABLE IF NOT EXISTS completion_report_review_notes (
    id TEXT PRIMARY KEY,
    completion_report_id TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    author_user_id TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_completion_report_review_notes_report
    ON completion_report_review_notes (completion_report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_completion_report_review_notes_org
    ON completion_report_review_notes (organization_id, created_at DESC);
