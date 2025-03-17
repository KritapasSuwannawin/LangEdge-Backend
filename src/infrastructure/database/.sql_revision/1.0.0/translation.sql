-- Create table "translation" with the following columns:
-- id: serial
-- input_text: text, not null
-- input_language_id: integer, not null
-- output_text: text, not null
-- output_language_id: integer, not null
-- created_at: timestamp with time zone, not null, default now()
-- Primary key on (id, input_language_id)
-- Unique constraint on (input_text, input_language_id, output_language_id)
-- Partitioned by list on column "input_language_id"
CREATE TABLE translation (
    id SERIAL,
    input_text TEXT NOT NULL,
    input_language_id INTEGER NOT NULL,
    output_text TEXT NOT NULL,
    output_language_id INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, input_language_id),
    UNIQUE (input_text, input_language_id, output_language_id)
) PARTITION BY LIST (input_language_id);

-- Loop create partitions using language(id) with the following foreign key constraints:
-- input_language_id -> language(id), on delete cascade, on update cascade
-- output_language_id -> language(id), on delete cascade, on update cascade
DO $$
DECLARE
    current_language RECORD;
    total_language_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_language_count FROM language;

    FOR current_language IN SELECT id FROM language
    LOOP
        EXECUTE FORMAT('CREATE TABLE translation_%s PARTITION OF translation FOR VALUES IN (%s)', current_language.id, current_language.id);

        EXECUTE FORMAT('ALTER TABLE translation_%s ADD CONSTRAINT fk_input_language_id_%s FOREIGN KEY (input_language_id) REFERENCES language(id) ON DELETE CASCADE ON UPDATE CASCADE', current_language.id, current_language.id);

        EXECUTE FORMAT('ALTER TABLE translation_%s ADD CONSTRAINT fk_output_language_id_%s FOREIGN KEY (output_language_id) REFERENCES language(id) ON DELETE CASCADE ON UPDATE CASCADE', current_language.id, current_language.id);

        RAISE NOTICE 'Partition created for language with id % / %', current_language.id, total_language_count;
    END LOOP;
END $$;
