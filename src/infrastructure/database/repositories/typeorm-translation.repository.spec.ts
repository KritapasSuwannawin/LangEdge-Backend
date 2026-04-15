import { INestApplication } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ENTITIES } from '@/infrastructure/database/entities';
import { Language } from '@/infrastructure/database/entities/language.entity';
import { Translation } from '@/infrastructure/database/entities/translation.entity';

import { TypeOrmTranslationRepository } from './typeorm-translation.repository';

describe('TypeOrmTranslationRepository (integration)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let languageRepository: Repository<Language>;
  let translationEntityRepository: Repository<Translation>;
  let translationRepository: TypeOrmTranslationRepository;

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
              throw new Error('DATABASE_CONNECTION_STRING is required for translation repository integration tests');
            }

            return {
              type: 'postgres' as const,
              url: `${databaseConnectionString}-e2e`,
              entities: ENTITIES,
              synchronize: true,
            };
          },
        }),
        TypeOrmModule.forFeature([Language, Translation]),
      ],
      providers: [TypeOrmTranslationRepository],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = app.get(DataSource);
    languageRepository = app.get<Repository<Language>>(getRepositoryToken(Language));
    translationEntityRepository = app.get<Repository<Translation>>(getRepositoryToken(Translation));
    translationRepository = app.get(TypeOrmTranslationRepository);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
  });

  it('should return translations in the requested id order', async () => {
    const { english, spanish } = await seedLanguages(languageRepository);
    const savedTranslations = await translationEntityRepository.save([
      {
        input_text: 'first',
        input_language_id: english.id,
        output_text: 'primero',
        output_language_id: spanish.id,
      },
      {
        input_text: 'second',
        input_language_id: english.id,
        output_text: 'segundo',
        output_language_id: spanish.id,
      },
      {
        input_text: 'third',
        input_language_id: english.id,
        output_text: 'tercero',
        output_language_id: spanish.id,
      },
    ]);

    const result = await translationRepository.findByIds([savedTranslations[2].id, savedTranslations[0].id, savedTranslations[1].id]);

    expect(result.map((translation) => translation.id)).toEqual([
      savedTranslations[2].id,
      savedTranslations[0].id,
      savedTranslations[1].id,
    ]);
    expect(result.map((translation) => translation.outputText)).toEqual(['tercero', 'primero', 'segundo']);
  });

  it('should preserve duplicate ids and skip missing translations', async () => {
    const { english, spanish } = await seedLanguages(languageRepository);
    const savedTranslations = await translationEntityRepository.save([
      {
        input_text: 'alpha',
        input_language_id: english.id,
        output_text: 'alfa',
        output_language_id: spanish.id,
      },
      {
        input_text: 'beta',
        input_language_id: english.id,
        output_text: 'beta',
        output_language_id: spanish.id,
      },
    ]);

    const result = await translationRepository.findByIds([
      savedTranslations[1].id,
      999999,
      savedTranslations[1].id,
      savedTranslations[0].id,
    ]);

    expect(result.map((translation) => translation.id)).toEqual([
      savedTranslations[1].id,
      savedTranslations[1].id,
      savedTranslations[0].id,
    ]);
  });
});

async function seedLanguages(languageRepository: Repository<Language>): Promise<{ english: Language; spanish: Language }> {
  const [english, spanish] = await languageRepository.save([
    { name: 'English', code: 'en' },
    { name: 'Spanish', code: 'es' },
  ]);

  return { english, spanish };
}
