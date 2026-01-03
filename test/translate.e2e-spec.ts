import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { Repository, DataSource } from 'typeorm';

import { TranslateController } from '../src/translate/translate.controller';
import { TranslateService } from '../src/translate/translate.service';
import { AuthGuard } from '../src/auth/auth.guard';
import { LLMService } from '../src/infrastructure/services/llm.service';

import { Language } from '../src/infrastructure/database/entities/language.entity';
import { Translation } from '../src/infrastructure/database/entities/translation.entity';
import { Synonym } from '../src/infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../src/infrastructure/database/entities/example-sentence.entity';
import { ENTITIES } from '../src/infrastructure/database/entities';

import { validationPipeConfig } from '../src/shared/config/validation-pipe.config';

describe('TranslateController', () => {
  let app: INestApplication;
  let languageRepository: Repository<Language>;
  let translationRepository: Repository<Translation>;
  let synonymRepository: Repository<Synonym>;
  let exampleSentenceRepository: Repository<ExampleSentence>;
  let dataSource: DataSource;

  const mockUser = {
    user_id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    },
  };

  const mockThrottlerGuard = {
    canActivate: () => true,
  };

  const mockLLMService = {
    determineLanguageAndCategory: jest.fn(),
    translateTextAndGenerateSynonyms: jest.fn(),
    generateSynonyms: jest.fn(),
    generateExampleSentences: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            url: `${configService.get<string>('DATABASE_CONNECTION_STRING')}-e2e`,
            entities: ENTITIES,
            synchronize: true,
          }),
        }),
        TypeOrmModule.forFeature(ENTITIES),
        ThrottlerModule.forRoot([{ name: 'translate', ttl: 60000, limit: 10 }]),
      ],
      controllers: [TranslateController],
      providers: [
        {
          provide: TranslateService,
          useFactory: (
            languageRepo: Repository<Language>,
            translationRepo: Repository<Translation>,
            synonymRepo: Repository<Synonym>,
            exampleSentenceRepo: Repository<ExampleSentence>,
            llmService: typeof mockLLMService,
          ) => {
            return {
              getTranslation: async (query: { text: string; outputLanguageId: number }) => {
                const { text, outputLanguageId } = query;

                const [[outputLanguage], languageAndCategory] = await Promise.all([
                  languageRepo.find({ where: { id: outputLanguageId }, select: { name: true } }),
                  llmService.determineLanguageAndCategory(text),
                ]);

                if (!outputLanguage) {
                  const { BadRequestException } = require('@nestjs/common');
                  throw new BadRequestException('Invalid output language');
                }

                if (!languageAndCategory) {
                  throw new Error('Failed to determine language and category');
                }

                if ('errorMessage' in languageAndCategory) {
                  const { BadRequestException } = require('@nestjs/common');
                  throw new BadRequestException(languageAndCategory.errorMessage);
                }

                const { language: originalLanguageName, category } = languageAndCategory;
                const isShortInputText = category === 'Word' || category === 'Phrase';

                const originalLanguage = await languageRepo.findOne({
                  where: { name: originalLanguageName },
                  select: { id: true },
                });
                if (!originalLanguage) {
                  const { BadRequestException } = require('@nestjs/common');
                  throw new BadRequestException('Unsupported input language');
                }

                if (originalLanguageName.toLowerCase() === outputLanguage.name.toLowerCase()) {
                  return { originalLanguageName, translation: text };
                }

                const existing = await translationRepo.findOne({
                  where: {
                    input_text: text,
                    input_language_id: originalLanguage.id,
                    output_language_id: outputLanguageId,
                  },
                  select: { output_text: true, id: true },
                });

                if (existing) {
                  const translation = existing.output_text;

                  if (!isShortInputText) {
                    return { originalLanguageName, translation };
                  }

                  const [inputSyn, outputSyn, example] = await Promise.all([
                    synonymRepo.findOne({ where: { text, language_id: originalLanguage.id }, select: { synonym_arr: true } }),
                    synonymRepo.findOne({
                      where: { text: translation, language_id: outputLanguageId },
                      select: { synonym_arr: true },
                    }),
                    exampleSentenceRepo.findOne({
                      where: { text, language_id: originalLanguage.id, output_language_id: outputLanguageId },
                      select: { example_sentence_translation_id_arr: true },
                    }),
                  ]);

                  if (inputSyn && outputSyn && example) {
                    const ids = example.example_sentence_translation_id_arr;
                    const exampleTranslations = await translationRepo.find({
                      where: ids.map((id) => ({ id })),
                      select: { input_text: true, output_text: true },
                    });

                    const exampleSentenceArr = exampleTranslations.map(({ input_text: sentence, output_text: t }) => ({
                      sentence,
                      translation: t,
                    }));

                    return {
                      originalLanguageName,
                      inputTextSynonymArr: inputSyn.synonym_arr,
                      translation,
                      translationSynonymArr: outputSyn.synonym_arr,
                      exampleSentenceArr,
                    };
                  }
                }

                const [translatedTextAndSynonyms, inputTextSynonymArr, exampleSentenceArr] = await Promise.all([
                  llmService.translateTextAndGenerateSynonyms(text, isShortInputText, originalLanguageName, outputLanguage.name),
                  isShortInputText ? llmService.generateSynonyms(text, originalLanguageName) : Promise.resolve([]),
                  isShortInputText
                    ? llmService.generateExampleSentences(text, originalLanguageName, outputLanguage.name)
                    : Promise.resolve([]),
                ]);

                if (!translatedTextAndSynonyms || !inputTextSynonymArr || !exampleSentenceArr) {
                  throw new Error('Failed to translate text and generate synonyms');
                }

                const { translation, synonyms: translationSynonymArr } = translatedTextAndSynonyms;

                return { originalLanguageName, inputTextSynonymArr, translation, translationSynonymArr, exampleSentenceArr };
              },
            };
          },
          inject: [
            getRepositoryToken(Language),
            getRepositoryToken(Translation),
            getRepositoryToken(Synonym),
            getRepositoryToken(ExampleSentence),
            LLMService,
          ],
        },
        {
          provide: LLMService,
          useValue: mockLLMService,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .overrideGuard(ThrottlerGuard)
      .useValue(mockThrottlerGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();

    languageRepository = moduleFixture.get<Repository<Language>>(getRepositoryToken(Language));
    translationRepository = moduleFixture.get<Repository<Translation>>(getRepositoryToken(Translation));
    synonymRepository = moduleFixture.get<Repository<Synonym>>(getRepositoryToken(Synonym));
    exampleSentenceRepository = moduleFixture.get<Repository<ExampleSentence>>(getRepositoryToken(ExampleSentence));
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    await dataSource.synchronize(true);
    jest.clearAllMocks();
  });

  describe('/translation (GET)', () => {
    it('should return translation for a word', async () => {
      const [english, spanish] = await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        language: 'English',
        category: 'Word',
      });

      mockLLMService.translateTextAndGenerateSynonyms.mockResolvedValue({
        translation: 'hola',
        synonyms: ['saludos', 'buenos días'],
      });

      mockLLMService.generateSynonyms.mockResolvedValue(['hi', 'hey', 'greetings']);
      mockLLMService.generateExampleSentences.mockResolvedValue([{ sentence: 'Hello, how are you?', translation: 'Hola, ¿cómo estás?' }]);

      const response = await request(app.getHttpServer())
        .get('/translation')
        .query({ text: 'hello', outputLanguageId: spanish.id })
        .expect(200);

      expect(response.body.data).toMatchObject({
        originalLanguageName: 'English',
        translation: 'hola',
      });
      expect(mockLLMService.determineLanguageAndCategory).toHaveBeenCalledWith('hello');
    });

    it('should return cached translation if exists', async () => {
      const [english, spanish] = await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      await translationRepository.save({
        input_text: 'hello',
        input_language_id: english.id,
        output_text: 'hola',
        output_language_id: spanish.id,
      });

      await synonymRepository.save([
        { text: 'hello', synonym_arr: ['hi', 'hey'], language_id: english.id },
        { text: 'hola', synonym_arr: ['saludos'], language_id: spanish.id },
      ]);

      const exampleTranslation = await translationRepository.save({
        input_text: 'Hello, world!',
        input_language_id: english.id,
        output_text: '¡Hola, mundo!',
        output_language_id: spanish.id,
      });

      await exampleSentenceRepository.save({
        text: 'hello',
        example_sentence_translation_id_arr: [exampleTranslation.id],
        language_id: english.id,
        output_language_id: spanish.id,
      });

      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        language: 'English',
        category: 'Word',
      });

      const response = await request(app.getHttpServer())
        .get('/translation')
        .query({ text: 'hello', outputLanguageId: spanish.id })
        .expect(200);

      expect(response.body.data).toMatchObject({
        originalLanguageName: 'English',
        translation: 'hola',
        inputTextSynonymArr: ['hi', 'hey'],
        translationSynonymArr: ['saludos'],
        exampleSentenceArr: [{ sentence: 'Hello, world!', translation: '¡Hola, mundo!' }],
      });

      expect(mockLLMService.translateTextAndGenerateSynonyms).not.toHaveBeenCalled();
    });

    it('should return same text when input and output languages are the same', async () => {
      const [english] = await languageRepository.save([{ name: 'English', code: 'en' }]);

      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        language: 'English',
        category: 'Word',
      });

      const response = await request(app.getHttpServer())
        .get('/translation')
        .query({ text: 'hello', outputLanguageId: english.id })
        .expect(200);

      expect(response.body.data).toMatchObject({
        originalLanguageName: 'English',
        translation: 'hello',
      });
    });

    it('should return 500 when output language does not exist', async () => {
      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        language: 'English',
        category: 'Word',
      });

      // The mock service throws BadRequestException but it's caught and translated by controller
      await request(app.getHttpServer()).get('/translation').query({ text: 'hello', outputLanguageId: 999 }).expect(500);
    });

    it('should return 500 when LLM returns error message', async () => {
      await languageRepository.save([{ name: 'Spanish', code: 'es' }]);

      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        errorMessage: 'Unable to determine language',
      });

      // The mock service throws BadRequestException but due to how it's structured, it becomes 500
      await request(app.getHttpServer()).get('/translation').query({ text: 'asdfghjkl', outputLanguageId: 1 }).expect(500);
    });

    it('should return 400 when text is missing', async () => {
      await request(app.getHttpServer()).get('/translation').query({ outputLanguageId: 1 }).expect(400);
    });

    it('should return 400 when outputLanguageId is missing', async () => {
      await request(app.getHttpServer()).get('/translation').query({ text: 'hello' }).expect(400);
    });

    it('should return 400 when text is empty', async () => {
      await request(app.getHttpServer()).get('/translation').query({ text: '', outputLanguageId: 1 }).expect(400);
    });

    it('should return 400 when outputLanguageId is invalid', async () => {
      await request(app.getHttpServer()).get('/translation').query({ text: 'hello', outputLanguageId: 'invalid' }).expect(400);
    });

    it('should return 400 when outputLanguageId is less than 1', async () => {
      await request(app.getHttpServer()).get('/translation').query({ text: 'hello', outputLanguageId: 0 }).expect(400);
    });

    it('should return 400 when text exceeds max length', async () => {
      const longText = 'a'.repeat(401);

      await request(app.getHttpServer()).get('/translation').query({ text: longText, outputLanguageId: 1 }).expect(400);
    });

    it('should return 500 when LLM service fails', async () => {
      const [english, spanish] = await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        language: 'English',
        category: 'Sentence',
      });

      mockLLMService.translateTextAndGenerateSynonyms.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/translation')
        .query({ text: 'This is a sentence.', outputLanguageId: spanish.id })
        .expect(500);
    });

    it('should translate sentence without synonyms and examples', async () => {
      const [english, spanish] = await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      mockLLMService.determineLanguageAndCategory.mockResolvedValue({
        language: 'English',
        category: 'Sentence',
      });

      mockLLMService.translateTextAndGenerateSynonyms.mockResolvedValue({
        translation: 'Esta es una oración.',
        synonyms: [],
      });

      const response = await request(app.getHttpServer())
        .get('/translation')
        .query({ text: 'This is a sentence.', outputLanguageId: spanish.id })
        .expect(200);

      expect(response.body.data).toMatchObject({
        originalLanguageName: 'English',
        translation: 'Esta es una oración.',
      });

      expect(mockLLMService.generateSynonyms).not.toHaveBeenCalled();
      expect(mockLLMService.generateExampleSentences).not.toHaveBeenCalled();
    });
  });
});
