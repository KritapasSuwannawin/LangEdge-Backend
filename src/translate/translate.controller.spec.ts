import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ENTITIES } from '../infrastructure/database/entities';

import { APP_IMPORTS } from '../app.imports';

describe('TranslateController', () => {
  let controller: TranslateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, TypeOrmModule.forFeature(ENTITIES), InfrastructureModule],
      controllers: [TranslateController],
      providers: [TranslateService],
    }).compile();

    controller = module.get<TranslateController>(TranslateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
