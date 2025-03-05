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
