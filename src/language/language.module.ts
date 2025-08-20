import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Language } from '../infrastructure/database/entities/language.entity';

import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';

@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  controllers: [LanguageController],
  providers: [LanguageService],
})
export class LanguageModule {}
