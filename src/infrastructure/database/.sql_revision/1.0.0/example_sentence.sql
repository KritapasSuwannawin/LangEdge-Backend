-- Create table "example_sentence" with the following columns:
-- id: serial
-- text: text, not null
-- example_sentence_translation_id_arr: integer array, not null, default '{}'::integer[]
-- language_id: integer, not null
-- output_language_id: integer, not null
-- Primary key on (id, language_id)
-- Unique constraint on (text, language_id, output_language_id)
-- Partitioned by list on column "language_id"
CREATE TABLE example_sentence (
    id SERIAL,
    text TEXT NOT NULL,
    example_sentence_translation_id_arr INTEGER[] NOT NULL DEFAULT '{}'::INTEGER[],
    language_id INTEGER NOT NULL,
    output_language_id INTEGER NOT NULL,
    PRIMARY KEY (id, language_id),
    UNIQUE (text, language_id, output_language_id)
) PARTITION BY LIST (language_id);

-- Loop create partitions using language(id) with the following foreign key constraints:
-- language_id -> language(id), on delete cascade, on update cascade
-- output_language_id -> language(id), on delete cascade, on update cascade
DO $$
DECLARE
    current_language RECORD;
    total_language_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_language_count FROM language;

    FOR current_language IN SELECT id FROM language
    LOOP
        EXECUTE FORMAT('CREATE TABLE example_sentence_%s PARTITION OF example_sentence FOR VALUES IN (%s)', current_language.id, current_language.id);

        EXECUTE FORMAT('ALTER TABLE example_sentence_%s ADD CONSTRAINT fk_language_id_%s FOREIGN KEY (language_id) REFERENCES language(id) ON DELETE CASCADE ON UPDATE CASCADE', current_language.id, current_language.id);

        EXECUTE FORMAT('ALTER TABLE example_sentence_%s ADD CONSTRAINT fk_output_language_id_%s FOREIGN KEY (output_language_id) REFERENCES language(id) ON DELETE CASCADE ON UPDATE CASCADE', current_language.id, current_language.id);

        RAISE NOTICE 'Partition created for language with id % / %', current_language.id, total_language_count;
    END LOOP;
END $$;
