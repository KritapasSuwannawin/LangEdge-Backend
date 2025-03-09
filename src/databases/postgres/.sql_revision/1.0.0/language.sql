-- Create table "language" with the following columns:
-- id: serial, primary key
-- name: text, not null, unique, check -> must begin with a capital letter, followed by lowercase letters, and contain only letters
-- code: text, not null, unique, check -> must be a 2-letter lowercase code
CREATE TABLE language (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE CHECK (name ~ '^[A-Z][a-z]+$'),
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^[a-z]{2}$')
);

-- Insert data into table "language"
INSERT INTO language (name, code) VALUES
    ('English', 'en'),
    ('Chinese', 'zh'),
    ('Hindi', 'hi'),
    ('Spanish', 'es'),
    ('French', 'fr'),
    ('German', 'de'),
    ('Russian', 'ru'),
    ('Arabic', 'ar'),
    ('Italian', 'it'),
    ('Korean', 'ko'),
    ('Punjabi', 'pa'),
    ('Bengali', 'bn'),
    ('Portuguese', 'pt'),
    ('Indonesian', 'id'),
    ('Urdu', 'ur'),
    ('Persian', 'fa'),
    ('Vietnamese', 'vi'),
    ('Polish', 'pl'),
    ('Samoan', 'sm'),
    ('Thai', 'th'),
    ('Ukrainian', 'uk'),
    ('Turkish', 'tr'),
    ('Norwegian', 'no'),
    ('Dutch', 'nl'),
    ('Greek', 'el'),
    ('Romanian', 'ro'),
    ('Swahili', 'sw'),
    ('Hungarian', 'hu'),
    ('Hebrew', 'he'),
    ('Swedish', 'sv'),
    ('Czech', 'cs'),
    ('Finnish', 'fi'),
    ('Tagalog', 'tl'),
    ('Burmese', 'my'),
    ('Tamil', 'ta'),
    ('Kannada', 'kn'),
    ('Pashto', 'ps'),
    ('Yoruba', 'yo'),
    ('Malay', 'ms'),
    ('Haitian', 'ht'),
    ('Nepali', 'ne'),
    ('Sinhala', 'si'),
    ('Catalan', 'ca'),
    ('Malagasy', 'mg'),
    ('Latvian', 'lv'),
    ('Lithuanian', 'lt'),
    ('Estonian', 'et'),
    ('Somali', 'so'),
    ('Maltese', 'mt'),
    ('Corsican', 'co'),
    ('Luxembourgish', 'lb'),
    ('Occitan', 'oc'),
    ('Welsh', 'cy'),
    ('Albanian', 'sq'),
    ('Macedonian', 'mk'),
    ('Icelandic', 'is'),
    ('Slovenian', 'sl'),
    ('Galician', 'gl'),
    ('Basque', 'eu'),
    ('Azerbaijani', 'az'),
    ('Uzbek', 'uz'),
    ('Kazakh', 'kk'),
    ('Mongolian', 'mn'),
    ('Lao', 'lo'),
    ('Telugu', 'te'),
    ('Marathi', 'mr'),
    ('Chichewa', 'ny'),
    ('Esperanto', 'eo'),
    ('Tajik', 'tg'),
    ('Yiddish', 'yi'),
    ('Zulu', 'zu'),
    ('Sundanese', 'su'),
    ('Tatar', 'tt'),
    ('Tswana', 'tn');

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
