-- Create table "language" with the following columns:
-- id: serial, primary key
-- name: text, not null, unique, check -> must begin with a capital letter, followed by lowercase letters, and contain only letters
-- code: text, not null, unique, check -> must be a 2-letter lowercase code
-- supported_by: text array, not null, default '{}'
CREATE TABLE language (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (name ~ '^[A-Z][a-z]+$'),
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z]{2}$')
    supported_by TEXT[] NOT NULL DEFAULT '{}'
);

-- Insert data into table "language"
INSERT INTO language (name, code, supported_by) VALUES
    ('English', 'en', '{gpt-4o-mini}'),
    ('Chinese', 'zh', '{gpt-4o-mini}'),
    ('Hindi', 'hi', '{gpt-4o-mini}'),
    ('Spanish', 'es', '{gpt-4o-mini}'),
    ('French', 'fr', '{gpt-4o-mini}'),
    ('German', 'de', '{gpt-4o-mini}'),
    ('Russian', 'ru', '{gpt-4o-mini}'),
    ('Arabic', 'ar', '{gpt-4o-mini}'),
    ('Italian', 'it', '{gpt-4o-mini}'),
    ('Korean', 'ko', '{gpt-4o-mini}'),
    ('Punjabi', 'pa', '{gpt-4o-mini}'),
    ('Bengali', 'bn', '{gpt-4o-mini}'),
    ('Portuguese', 'pt', '{gpt-4o-mini}'),
    ('Indonesian', 'id', '{gpt-4o-mini}'),
    ('Urdu', 'ur', '{gpt-4o-mini}'),
    ('Persian', 'fa', '{gpt-4o-mini}'),
    ('Vietnamese', 'vi', '{gpt-4o-mini}'),
    ('Polish', 'pl', '{gpt-4o-mini}'),
    ('Samoan', 'sm', '{gpt-4o-mini}'),
    ('Thai', 'th', '{gpt-4o-mini}'),
    ('Ukrainian', 'uk', '{gpt-4o-mini}'),
    ('Turkish', 'tr', '{gpt-4o-mini}'),
    ('Norwegian', 'no', '{gpt-4o-mini}'),
    ('Dutch', 'nl', '{gpt-4o-mini}'),
    ('Greek', 'el', '{gpt-4o-mini}'),
    ('Romanian', 'ro', '{gpt-4o-mini}'),
    ('Swahili', 'sw', '{gpt-4o-mini}'),
    ('Hungarian', 'hu', '{gpt-4o-mini}'),
    ('Hebrew', 'he', '{gpt-4o-mini}'),
    ('Swedish', 'sv', '{gpt-4o-mini}'),
    ('Czech', 'cs', '{gpt-4o-mini}'),
    ('Finnish', 'fi', '{gpt-4o-mini}'),
    ('Tagalog', 'tl', '{gpt-4o-mini}'),
    ('Burmese', 'my', '{gpt-4o-mini}'),
    ('Tamil', 'ta', '{gpt-4o-mini}'),
    ('Kannada', 'kn', '{gpt-4o-mini}'),
    ('Pashto', 'ps', '{gpt-4o-mini}'),
    ('Yoruba', 'yo', '{gpt-4o-mini}'),
    ('Malay', 'ms', '{gpt-4o-mini}'),
    ('Haitian', 'ht', '{gpt-4o-mini}'),
    ('Nepali', 'ne', '{gpt-4o-mini}'),
    ('Sinhala', 'si', '{gpt-4o-mini}'),
    ('Catalan', 'ca', '{gpt-4o-mini}'),
    ('Malagasy', 'mg', '{gpt-4o-mini}'),
    ('Latvian', 'lv', '{gpt-4o-mini}'),
    ('Lithuanian', 'lt', '{gpt-4o-mini}'),
    ('Estonian', 'et', '{gpt-4o-mini}'),
    ('Somali', 'so', '{gpt-4o-mini}'),
    ('Maltese', 'mt', '{gpt-4o-mini}'),
    ('Corsican', 'co', '{gpt-4o-mini}'),
    ('Luxembourgish', 'lb', '{gpt-4o-mini}'),
    ('Occitan', 'oc', '{gpt-4o-mini}'),
    ('Welsh', 'cy', '{gpt-4o-mini}'),
    ('Albanian', 'sq', '{gpt-4o-mini}'),
    ('Macedonian', 'mk', '{gpt-4o-mini}'),
    ('Icelandic', 'is', '{gpt-4o-mini}'),
    ('Slovenian', 'sl', '{gpt-4o-mini}'),
    ('Galician', 'gl', '{gpt-4o-mini}'),
    ('Basque', 'eu', '{gpt-4o-mini}'),
    ('Azerbaijani', 'az', '{gpt-4o-mini}'),
    ('Uzbek', 'uz', '{gpt-4o-mini}'),
    ('Kazakh', 'kk', '{gpt-4o-mini}'),
    ('Mongolian', 'mn', '{gpt-4o-mini}'),
    ('Lao', 'lo', '{gpt-4o-mini}'),
    ('Telugu', 'te', '{gpt-4o-mini}'),
    ('Marathi', 'mr', '{gpt-4o-mini}'),
    ('Chichewa', 'ny', '{gpt-4o-mini}'),
    ('Esperanto', 'eo', '{gpt-4o-mini}'),
    ('Tajik', 'tg', '{gpt-4o-mini}'),
    ('Yiddish', 'yi', '{gpt-4o-mini}'),
    ('Zulu', 'zu', '{gpt-4o-mini}'),
    ('Sundanese', 'su', '{gpt-4o-mini}'),
    ('Tatar', 'tt', '{gpt-4o-mini}'),
    ('Tswana', 'tn', '{gpt-4o-mini}');

-- Create after insert trigger with the following functionalities:
-- 1. Create partition translation_%s for language with id %s
-- 2. Create partition synonym_%s for language with id %s
-- 3. Create partition example_sentence_%s for language with id %s
CREATE OR REPLACE FUNCTION create_language_partitions()
RETURNS TRIGGER AS $$
BEGIN
    EXECUTE FORMAT('CREATE TABLE translation_%s PARTITION OF translation FOR VALUES IN (%s)', NEW.id, NEW.id);
    EXECUTE FORMAT('CREATE TABLE synonym_%s PARTITION OF synonym FOR VALUES IN (%s)', NEW.id, NEW.id);
    EXECUTE FORMAT('CREATE TABLE example_sentence_%s PARTITION OF example_sentence FOR VALUES IN (%s)', NEW.id, NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER language_after_insert_trigger
AFTER INSERT ON language
FOR EACH ROW
EXECUTE FUNCTION create_language_partitions();

-- Create before delete trigger with the following functionalities:
-- 1. Drop partition translation_%s for language with id %s
-- 2. Drop partition synonym_%s for language with id %s
-- 3. Drop partition example_sentence_%s for language with id %s
CREATE OR REPLACE FUNCTION drop_language_partitions()
RETURNS TRIGGER AS $$
BEGIN
    EXECUTE FORMAT('DROP TABLE translation_%s', OLD.id);
    EXECUTE FORMAT('DROP TABLE synonym_%s', OLD.id);
    EXECUTE FORMAT('DROP TABLE example_sentence_%s', OLD.id);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER language_before_delete_trigger
BEFORE DELETE ON language
FOR EACH ROW
EXECUTE FUNCTION drop_language_partitions();
