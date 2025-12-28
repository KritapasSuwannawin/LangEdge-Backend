import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';

import { validationPipeConfig } from '../src/shared/config/validation-pipe.config';

describe('AuthController', () => {
  let app: INestApplication;

  const mockAuthService = {
    refreshToken: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/token/refresh (POST)', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        idToken: 'new-id-token',
        refreshToken: 'new-refresh-token',
      };
      mockAuthService.refreshToken.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/token/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(201);

      expect(response.body).toEqual({
        data: {
          accessToken: 'new-id-token',
          refreshToken: 'new-refresh-token',
        },
      });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should return 400 when refreshToken is missing', async () => {
      await request(app.getHttpServer()).post('/auth/token/refresh').send({}).expect(400);
    });

    it('should return 400 when refreshToken is empty', async () => {
      await request(app.getHttpServer()).post('/auth/token/refresh').send({ refreshToken: '' }).expect(400);
    });

    it('should return 500 when service throws error', async () => {
      mockAuthService.refreshToken.mockRejectedValue(new Error('Firebase error'));

      await request(app.getHttpServer()).post('/auth/token/refresh').send({ refreshToken: 'invalid-refresh-token' }).expect(500);
    });
  });
});
