import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { AuthController } from '@/controllers/auth/auth.controller';
import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';
import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token.use-case';

import { applyHttpContractGlobals } from './http-contract-test-app.helper';

describe('AuthController', () => {
  let app: INestApplication;

  const mockAuthPort: jest.Mocked<Pick<IAuthPort, 'refreshToken'>> = {
    refreshToken: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [RefreshTokenUseCase, { provide: 'IAuthPort', useValue: mockAuthPort }],
    }).compile();

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
  });

  describe('/auth/token/refresh (POST)', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        idToken: 'new-id-token',
        refreshToken: 'new-refresh-token',
      };
      mockAuthPort.refreshToken.mockResolvedValue(mockResponse);

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
      expect(mockAuthPort.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
    });

    it('should return 400 when refreshToken is missing', async () => {
      const response = await request(app.getHttpServer()).post('/auth/token/refresh').send({}).expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([expect.objectContaining({ field: 'refreshToken', message: expect.any(String) })]),
        },
      });
      expect(mockAuthPort.refreshToken).not.toHaveBeenCalled();
    });

    it('should return 400 when refreshToken is empty', async () => {
      const response = await request(app.getHttpServer()).post('/auth/token/refresh').send({ refreshToken: '' }).expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        message: 'Invalid input',
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
          details: expect.arrayContaining([expect.objectContaining({ field: 'refreshToken', message: expect.any(String) })]),
        },
      });
      expect(mockAuthPort.refreshToken).not.toHaveBeenCalled();
    });

    it('should return 500 when service throws error', async () => {
      mockAuthPort.refreshToken.mockRejectedValue(new Error('Firebase error'));

      const response = await request(app.getHttpServer())
        .post('/auth/token/refresh')
        .send({ refreshToken: 'invalid-refresh-token' })
        .expect(500);

      expect(response.body).toEqual({
        statusCode: 500,
        message: 'Internal server error',
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      });
    });
  });
});
