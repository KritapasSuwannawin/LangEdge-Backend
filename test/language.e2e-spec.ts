import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { LanguageController } from '../src/language/language.controller';
import { LanguageService } from '../src/language/language.service';

import { Language } from '../src/infrastructure/database/entities/language.entity';
import { ENTITIES } from '../src/infrastructure/database/entities';

import { validationPipeConfig } from '../src/shared/config/validation-pipe.config';

describe('LanguageController', () => {
  let app: INestApplication;
  let languageRepository: Repository<Language>;
  let dataSource: DataSource;

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
      ],
      controllers: [LanguageController],
      providers: [LanguageService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();

    languageRepository = moduleFixture.get<Repository<Language>>(getRepositoryToken(Language));
    dataSource = moduleFixture.get<DataSource>(DataSource);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(async () => {
    // Clear all tables before each test
    await dataSource.synchronize(true);
  });

  describe('/language (GET)', () => {
    it('should return all languages when no id is provided', async () => {
      // Create languages
      await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
        { name: 'French', code: 'fr' },
      ]);

      const response = await request(app.getHttpServer()).get('/language').expect(200);

      expect(response.body.data.languageArr).toHaveLength(3);
      expect(response.body.data.languageArr).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'English', code: 'en' }),
          expect.objectContaining({ name: 'Spanish', code: 'es' }),
          expect.objectContaining({ name: 'French', code: 'fr' }),
        ]),
      );
    });

    it('should return empty array when no languages exist', async () => {
      const response = await request(app.getHttpServer()).get('/language').expect(200);

      expect(response.body.data.languageArr).toHaveLength(0);
    });

    it('should return specific language when id is provided', async () => {
      // Create languages
      const languages = await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      const response = await request(app.getHttpServer()).get(`/language?id=${languages[0].id}`).expect(200);

      expect(response.body.data.languageArr).toHaveLength(1);
      expect(response.body.data.languageArr[0]).toMatchObject({
        name: 'English',
        code: 'en',
      });
    });

    it('should return empty array when language with id does not exist', async () => {
      const response = await request(app.getHttpServer()).get('/language?id=999').expect(200);

      expect(response.body.data.languageArr).toHaveLength(0);
    });

    it('should return all languages when id is invalid string (transforms to undefined)', async () => {
      // Create languages to verify it returns all when id is invalid
      await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      // Invalid string is transformed to undefined by the DTO, so all languages are returned
      const response = await request(app.getHttpServer()).get('/language?id=invalid').expect(200);
      expect(response.body.data.languageArr).toHaveLength(2);
    });

    it('should return 400 when id is less than 1', async () => {
      await request(app.getHttpServer()).get('/language?id=0').expect(400);
    });

    it('should return 400 when id is negative', async () => {
      await request(app.getHttpServer()).get('/language?id=-1').expect(400);
    });
  });
});
