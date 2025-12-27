import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserController } from './user.controller';
import { UserService } from './user.service';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ENTITIES } from '../infrastructure/database/entities';

import { APP_IMPORTS } from '../app.imports';

describe('UserController', () => {
  let controller: UserController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, TypeOrmModule.forFeature(ENTITIES), InfrastructureModule],
      controllers: [UserController],
      providers: [UserService],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
