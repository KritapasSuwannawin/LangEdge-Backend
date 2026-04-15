import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, INestApplication, UnauthorizedException } from '@nestjs/common';
import request from 'supertest';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { UserController } from '@/controllers/user/user.controller';
import { SignInUserUseCase } from '@/use-cases/user/sign-in-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';
import { TypeOrmUserRepository } from '@/infrastructure/database/repositories/typeorm-user.repository';
import { AuthGuard } from '@/modules/auth/auth.guard';

import { User } from '@/infrastructure/database/entities/user.entity';
import { Language } from '@/infrastructure/database/entities/language.entity';
import { ENTITIES } from '@/infrastructure/database/entities';

import { applyHttpContractGlobals } from './http-contract-test-app.helper';

const mockFileDownloadPort = {
  downloadAsBase64DataUrl: jest.fn().mockResolvedValue('data:image/png;base64,mockImageData'),
};

describe('UserController', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let languageRepository: Repository<Language>;
  let dataSource: DataSource;

  const defaultUser = {
    user_id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/picture.jpg',
  };

  let authenticatedUser: Record<string, unknown> = { ...defaultUser };
  let shouldRejectAuthorization = false;

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      if (shouldRejectAuthorization) {
        throw new UnauthorizedException();
      }

      const req = context.switchToHttp().getRequest();
      req.user = authenticatedUser;
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
      providers: [
        SignInUserUseCase,
        UpdateUserUseCase,
        { provide: 'IUserRepository', useClass: TypeOrmUserRepository },
        { provide: 'IFileDownloadPort', useValue: mockFileDownloadPort },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    applyHttpContractGlobals(app);
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
    authenticatedUser = { ...defaultUser };
    shouldRejectAuthorization = false;
    mockFileDownloadPort.downloadAsBase64DataUrl.mockClear();

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

      expect(response.body).toEqual({
        data: {
          message: 'Success',
        },
      });

      // Verify user was updated
      const updatedUser = await userRepository.findOne({ where: { id: 'test-user-id' } });
      expect(updatedUser?.last_used_language_id).toBe(language.id);
    });

    it('should return 404 USER_NOT_FOUND when user does not exist', async () => {
      const response = await request(app.getHttpServer()).patch('/user').send({ lastUsedLanguageId: 1 }).expect(404);

      expect(response.body).toEqual({
        statusCode: 404,
        message: 'Not found',
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    });

    it('should return 400 when lastUsedLanguageId is missing', async () => {
      const response = await request(app.getHttpServer()).patch('/user').send({}).expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([expect.objectContaining({ field: 'lastUsedLanguageId', message: expect.any(String) })]),
        },
      });
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

      expect(response.body).toEqual({
        data: {
          userId: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          pictureUrl: 'data:image/png;base64,mockImageData',
        },
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

      expect(response.body).toEqual({
        data: {
          userId: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          pictureUrl: 'data:image/png;base64,mockImageData',
          lastUsedLanguageId: language.id,
        },
      });

      // Verify user was updated
      const updatedUser = await userRepository.findOne({ where: { id: 'test-user-id' } });
      expect(updatedUser?.email).toBe('test@example.com');
      expect(updatedUser?.name).toBe('Test User');
    });

    it('should return 401 UNAUTHORIZED when auth guard rejects the sign-in request', async () => {
      shouldRejectAuthorization = true;

      const response = await request(app.getHttpServer()).post('/user/sign-in').expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Unauthorized',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Unauthorized',
        },
      });
    });

    it('should return 400 validation envelope when email is missing from auth context', async () => {
      authenticatedUser = {
        user_id: 'test-user-id',
        name: 'Test User',
      };

      const response = await request(app.getHttpServer()).post('/user/sign-in').expect(400);

      expect(response.body).toEqual({
        statusCode: 400,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Email is required',
          details: [{ field: 'email', message: 'Email is required' }],
        },
      });
    });
  });
});
