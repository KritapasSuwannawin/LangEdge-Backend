import { Test, TestingModule } from '@nestjs/testing';

import { AuthService } from './auth.service';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';

import { APP_IMPORTS } from '../app.imports';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, InfrastructureModule],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
