import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';

import { AuthGuard } from '../src/modules/auth/auth.guard';
import { TranslateController } from '../src/controllers/translate/translate.controller';
import { GetTranslationUseCase } from '../src/use-cases/translate/get-translation.use-case';

import { applyHttpContractGlobals } from './http-contract-test-app.helper';

describe('TranslateController rate limit contract', () => {
  let app: INestApplication;

  const mockAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const req = context.switchToHttp().getRequest();
      req.user = {
        user_id: 'rate-limit-user-id',
        email: 'rate-limit@example.com',
        name: 'Rate Limit User',
      };
      return true;
    },
  };

  const mockGetTranslationUseCase: jest.Mocked<Pick<GetTranslationUseCase, 'execute'>> = {
    execute: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ name: 'translate', ttl: 60000, limit: 10 }])],
      controllers: [TranslateController],
      providers: [
        {
          provide: GetTranslationUseCase,
          useValue: mockGetTranslationUseCase,
        },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue(mockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    applyHttpContractGlobals(app);
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTranslationUseCase.execute.mockResolvedValue({
      originalLanguageName: 'English',
      translation: 'hola',
    });
  });

  it('should return a normalized 429 envelope after the translate route exceeds its throttle limit', async () => {
    for (let requestCount = 0; requestCount < 10; requestCount += 1) {
      await request(app.getHttpServer()).get('/translation').query({ text: 'hello', outputLanguageId: 2 }).expect(200);
    }

    const response = await request(app.getHttpServer()).get('/translation').query({ text: 'hello', outputLanguageId: 2 }).expect(429);

    expect(response.body).toEqual({
      statusCode: 429,
      message: 'Too many requests',
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests',
      },
    });
    expect(mockGetTranslationUseCase.execute).toHaveBeenCalledTimes(10);
  });
});
