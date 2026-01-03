import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { UserController } from '../src/user/user.controller';
import { UserService } from '../src/user/user.service';
import { AuthGuard } from '../src/auth/auth.guard';

import { User } from '../src/infrastructure/database/entities/user.entity';
import { Language } from '../src/infrastructure/database/entities/language.entity';
import { ENTITIES } from '../src/infrastructure/database/entities';

import { validationPipeConfig } from '../src/shared/config/validation-pipe.config';

jest.mock('../src/shared/utils/httpUtils', () => ({
  downloadFile: jest.fn().mockResolvedValue('data:image/png;base64,mockImageData'),
}));

describe('UserController', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let languageRepository: Repository<Language>;
  let dataSource: DataSource;

  const mockUser = {
    user_id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/picture.jpg',
  };

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    },
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
      ],
      controllers: [UserController],
      providers: [UserService],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
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

  describe('/user (PATCH)', () => {
    it('should update user lastUsedLanguageId successfully', async () => {
      // Create a language first
      const language = await languageRepository.save({
        name: 'English',
        code: 'en',
      });

      // Create a user
      await userRepository.save({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        picture_url: null,
      });

      const response = await request(app.getHttpServer()).patch('/user').send({ lastUsedLanguageId: language.id }).expect(200);

      expect(response.body).toEqual({ message: 'Success' });

      // Verify user was updated
      const updatedUser = await userRepository.findOne({ where: { id: 'test-user-id' } });
      expect(updatedUser?.last_used_language_id).toBe(language.id);
    });

    it('should return 400 when user does not exist', async () => {
      await request(app.getHttpServer()).patch('/user').send({ lastUsedLanguageId: 1 }).expect(400);
    });

    it('should return 400 when lastUsedLanguageId is missing', async () => {
      await request(app.getHttpServer()).patch('/user').send({}).expect(400);
    });

    it('should return 400 when lastUsedLanguageId is invalid', async () => {
      await request(app.getHttpServer()).patch('/user').send({ lastUsedLanguageId: 'invalid' }).expect(400);
    });

    it('should return 400 when lastUsedLanguageId is less than 1', async () => {
      await request(app.getHttpServer()).patch('/user').send({ lastUsedLanguageId: 0 }).expect(400);
    });
  });

  describe('/user/sign-in (POST)', () => {
    it('should sign in new user successfully', async () => {
      const response = await request(app.getHttpServer()).post('/user/sign-in').expect(201);

      expect(response.body.data).toMatchObject({
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      });

      // Verify user was created
      const createdUser = await userRepository.findOne({ where: { id: 'test-user-id' } });
      expect(createdUser).toBeDefined();
      expect(createdUser?.email).toBe('test@example.com');
    });

    it('should sign in existing user and update info', async () => {
      // Create a language first
      const language = await languageRepository.save({
        name: 'English',
        code: 'en',
      });

      // Create an existing user
      await userRepository.save({
        id: 'test-user-id',
        email: 'old@example.com',
        name: 'Old Name',
        picture_url: null,
        last_used_language_id: language.id,
      });

      const response = await request(app.getHttpServer()).post('/user/sign-in').expect(201);

      expect(response.body.data).toMatchObject({
        userId: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        lastUsedLanguageId: language.id,
      });

      // Verify user was updated
      const updatedUser = await userRepository.findOne({ where: { id: 'test-user-id' } });
      expect(updatedUser?.email).toBe('test@example.com');
      expect(updatedUser?.name).toBe('Test User');
    });

    it('should return 400 when email is missing from token', async () => {
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
        controllers: [UserController],
        providers: [
          {
            provide: UserService,
            useValue: {
              updateUser: jest.fn(),
              signInUser: jest.fn(),
            },
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            req.user = { user_id: 'test-user-id', name: 'Test User' }; // No email
            return true;
          },
        })
        .compile();

      const testApp = moduleFixture.createNestApplication();
      testApp.useGlobalPipes(
        new ValidationPipe({
          transform: true,
          transformOptions: { enableImplicitConversion: true },
          whitelist: true,
          forbidNonWhitelisted: true,
          stopAtFirstError: true,
          validationError: { target: false, value: false },
        }),
      );
      await testApp.init();

      await request(testApp.getHttpServer()).post('/user/sign-in').expect(400);

      await testApp.close();
    });
  });
});
