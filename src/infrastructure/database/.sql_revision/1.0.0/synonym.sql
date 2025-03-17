-- Create table "synonym" with the following columns:
-- id: serial
-- text: text, not null
-- synonym_arr: text array, not null, default '{}'::text[]
-- language_id: integer, not null
-- Primary key on (id, language_id)
-- Unique constraint on (text, language_id)
-- Partitioned by list on column "language_id"
CREATE TABLE synonym (
    id SERIAL,
    text TEXT NOT NULL,
    synonym_arr TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
    language_id INTEGER NOT NULL,
    PRIMARY KEY (id, language_id),
    UNIQUE (text, language_id)
) PARTITION BY LIST (language_id);

-- Loop create partitions using language(id) with the following foreign key constraint:
-- language_id -> language(id), on delete cascade, on update cascade
DO $$
DECLARE
    current_language RECORD;
    total_language_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_language_count FROM language;

    FOR current_language IN SELECT id FROM language
    LOOP
        EXECUTE FORMAT('CREATE TABLE synonym_%s PARTITION OF synonym FOR VALUES IN (%s)', current_language.id, current_language.id);

        EXECUTE FORMAT('ALTER TABLE synonym_%s ADD CONSTRAINT fk_language_id_%s FOREIGN KEY (language_id) REFERENCES language(id) ON DELETE CASCADE ON UPDATE CASCADE', current_language.id, current_language.id);

        RAISE NOTICE 'Partition created for language with id % / %', current_language.id, total_language_count;
    END LOOP;
END $$;
