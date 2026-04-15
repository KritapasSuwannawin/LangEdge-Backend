import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { ENTITIES } from '@/infrastructure/database/entities';
import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import { Language } from '@/infrastructure/database/entities/language.entity';
import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import { Translation } from '@/infrastructure/database/entities/translation.entity';

import { TypeOrmTranslationCacheWriter } from './typeorm-translation-cache-writer';

describe('TypeOrmTranslationCacheWriter (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let languageRepository: Repository<Language>;
  let translationRepository: Repository<Translation>;
  let synonymRepository: Repository<Synonym>;
  let exampleSentenceRepository: Repository<ExampleSentence>;
  let translationCacheWriter: TypeOrmTranslationCacheWriter;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const databaseConnectionString = configService.get<string>('DATABASE_CONNECTION_STRING');

            if (!databaseConnectionString) {
              throw new Error('DATABASE_CONNECTION_STRING is required for translation cache writer integration tests');
            }

            return {
              type: 'postgres' as const,
              url: `${databaseConnectionString}-e2e`,
              entities: ENTITIES,
              synchronize: true,
            };
          },
        }),
        TypeOrmModule.forFeature([Language, Translation, Synonym, ExampleSentence]),
      ],
      providers: [TypeOrmTranslationCacheWriter],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    languageRepository = app.get<Repository<Language>>(getRepositoryToken(Language));
    translationRepository = app.get<Repository<Translation>>(getRepositoryToken(Translation));
    synonymRepository = app.get<Repository<Synonym>>(getRepositoryToken(Synonym));
    exampleSentenceRepository = app.get<Repository<ExampleSentence>>(getRepositoryToken(ExampleSentence));
    translationCacheWriter = app.get(TypeOrmTranslationCacheWriter);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  it('should persist the short-text cache bundle in one transaction', async () => {
    const { english, spanish } = await seedLanguages(languageRepository);

    await translationCacheWriter.saveShortTranslationCache({
      inputText: 'hello',
      inputLanguageId: english.id,
      outputText: 'hola',
      outputLanguageId: spanish.id,
      inputTextSynonymArr: ['hi', 'hey'],
      translationSynonymArr: ['saludo'],
      exampleSentenceArr: [
        { sentence: 'hello world', translation: 'hola mundo' },
        { sentence: 'hello friend', translation: 'hola amigo' },
      ],
    });

    const savedExampleSentence = await exampleSentenceRepository.findOneBy({
      text: 'hello',
      language_id: english.id,
      output_language_id: spanish.id,
    });
    const savedMainTranslation = await translationRepository.findOneBy({
      input_text: 'hello',
      input_language_id: english.id,
      output_language_id: spanish.id,
    });
    const inputSynonym = await synonymRepository.findOneBy({ text: 'hello', language_id: english.id });
    const outputSynonym = await synonymRepository.findOneBy({ text: 'hola', language_id: spanish.id });

    expect(savedMainTranslation?.output_text).toBe('hola');
    expect(savedExampleSentence?.example_sentence_translation_id_arr).toHaveLength(2);
    expect(inputSynonym?.synonym_arr).toEqual(['hi', 'hey']);
    expect(outputSynonym?.synonym_arr).toEqual(['saludo']);

    const exampleTranslations = await translationRepository.findBy({
      id: In(savedExampleSentence?.example_sentence_translation_id_arr ?? []),
    });
    const exampleTranslationsById = new Map(exampleTranslations.map((translation) => [translation.id, translation]));

    expect(
      (savedExampleSentence?.example_sentence_translation_id_arr ?? []).map((id) => exampleTranslationsById.get(id)?.input_text),
    ).toEqual(['hello world', 'hello friend']);
    expect(
      (savedExampleSentence?.example_sentence_translation_id_arr ?? []).map((id) => exampleTranslationsById.get(id)?.output_text),
    ).toEqual(['hola mundo', 'hola amigo']);
  });

  it('should ignore duplicate synonym rows and still commit the rest of the cache write', async () => {
    const { english, spanish } = await seedLanguages(languageRepository);

    await synonymRepository.save({
      text: 'hello',
      synonym_arr: ['existing'],
      language_id: english.id,
    });

    await translationCacheWriter.saveShortTranslationCache({
      inputText: 'hello',
      inputLanguageId: english.id,
      outputText: 'hola',
      outputLanguageId: spanish.id,
      inputTextSynonymArr: ['hi', 'hey'],
      translationSynonymArr: ['saludo'],
      exampleSentenceArr: [{ sentence: 'hello world', translation: 'hola mundo' }],
    });

    const synonyms = await synonymRepository.find({ order: { id: 'ASC' } });
    const savedMainTranslation = await translationRepository.findOneBy({
      input_text: 'hello',
      input_language_id: english.id,
      output_language_id: spanish.id,
    });
    const savedExampleSentence = await exampleSentenceRepository.findOneBy({
      text: 'hello',
      language_id: english.id,
      output_language_id: spanish.id,
    });

    expect(savedMainTranslation).not.toBeNull();
    expect(savedExampleSentence).not.toBeNull();
    expect(synonyms).toHaveLength(2);
    expect(synonyms.find((synonym) => synonym.text === 'hello')?.synonym_arr).toEqual(['existing']);
    expect(synonyms.find((synonym) => synonym.text === 'hola')?.synonym_arr).toEqual(['saludo']);
  });

  it('should roll back all writes when a non-duplicate persistence error occurs', async () => {
    const { english, spanish } = await seedLanguages(languageRepository);

    await exampleSentenceRepository.save({
      text: 'hello',
      example_sentence_translation_id_arr: [],
      language_id: english.id,
      output_language_id: spanish.id,
    });

    await expect(
      translationCacheWriter.saveShortTranslationCache({
        inputText: 'hello',
        inputLanguageId: english.id,
        outputText: 'hola',
        outputLanguageId: spanish.id,
        inputTextSynonymArr: ['hi', 'hey'],
        translationSynonymArr: ['saludo'],
        exampleSentenceArr: [{ sentence: 'hello world', translation: 'hola mundo' }],
      }),
    ).rejects.toThrow();

    expect(await translationRepository.count()).toBe(0);
    expect(await synonymRepository.count()).toBe(0);
    expect(await exampleSentenceRepository.count()).toBe(1);
  });
});

async function seedLanguages(languageRepository: Repository<Language>): Promise<{ english: Language; spanish: Language }> {
  const [english, spanish] = await languageRepository.save([
    { name: 'English', code: 'en' },
    { name: 'Spanish', code: 'es' },
  ]);

  return { english, spanish };
}
