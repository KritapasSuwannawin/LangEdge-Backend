import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranslateService } from './translate.service';

import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { ENTITIES } from '../infrastructure/database/entities';

import { APP_IMPORTS } from '../app.imports';

describe('TranslateService', () => {
  let service: TranslateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, TypeOrmModule.forFeature(ENTITIES), InfrastructureModule],
      providers: [TranslateService],
    }).compile();

    service = module.get<TranslateService>(TranslateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
