-- Create table "user" with the following columns:
-- id: text, primary key
-- email: text, not null
-- name: text, not null
-- picture_url: text
-- created_at: timestamp with time zone, not null, default now()
CREATE TABLE "user" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add the following columns to the "user" table:
-- last_used_language_id: integer, foreign key to language(id), on delete set null, on update cascade
ALTER TABLE "user" ADD COLUMN last_used_language_id INTEGER;
ALTER TABLE "user" ADD CONSTRAINT fk_last_used_language_id FOREIGN KEY (last_used_language_id) REFERENCES language(id) ON DELETE SET NULL ON UPDATE CASCADE;