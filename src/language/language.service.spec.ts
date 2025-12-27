import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LanguageService } from './language.service';

import { ENTITIES } from '../infrastructure/database/entities';

import { APP_IMPORTS } from '../app.imports';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, TypeOrmModule.forFeature(ENTITIES)],
      providers: [LanguageService],
    }).compile();

    service = module.get<LanguageService>(LanguageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
