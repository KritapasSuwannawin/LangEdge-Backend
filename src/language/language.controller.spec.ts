import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';

import { ENTITIES } from '../infrastructure/database/entities';

import { APP_IMPORTS } from '../app.imports';

describe('LanguageController', () => {
  let controller: LanguageController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [...APP_IMPORTS, TypeOrmModule.forFeature(ENTITIES)],
      controllers: [LanguageController],
      providers: [LanguageService],
    }).compile();

    controller = module.get<LanguageController>(LanguageController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
