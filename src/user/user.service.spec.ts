import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserService } from './user.service';

import { ENTITIES } from '../infrastructure/database/entities';

import { APP_IMPORTS } from '../app.imports';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, TypeOrmModule.forFeature(ENTITIES)],
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
