import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Language } from '@/infrastructure/database/entities/language.entity';
import { ENTITIES } from '@/infrastructure/database/entities';
import { LanguageModule } from '@/modules/language/language.module';

import { applyHttpContractGlobals } from './http-contract-test-app.helper';

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
        LanguageModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    applyHttpContractGlobals(app);
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
      await languageRepository.save([
        { name: 'English', code: 'en' },
        { name: 'Spanish', code: 'es' },
      ]);

      const response = await request(app.getHttpServer()).get('/language?id=invalid').expect(200);
      expect(response.body.data.languageArr).toHaveLength(2);
    });

    it('should return 400 when id is less than 1', async () => {
      const response = await request(app.getHttpServer()).get('/language?id=0').expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'id must not be less than 1',
          details: [{ field: 'id', message: 'id must not be less than 1' }],
        },
      });
    });

    it('should return 400 when id is negative', async () => {
      await request(app.getHttpServer()).get('/language?id=-1').expect(400);
    });
  });
});
