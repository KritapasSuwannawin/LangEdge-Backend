import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';

import { ENTITIES } from '../infrastructure/database/entities';

@Module({
  imports: [TypeOrmModule.forFeature(ENTITIES)],
  controllers: [LanguageController],
  providers: [LanguageService],
})
export class LanguageModule {}
