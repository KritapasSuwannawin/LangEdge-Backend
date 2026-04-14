import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';

import { Language } from '@/infrastructure/database/entities/language.entity';
import { TypeOrmLanguageRepository } from '@/infrastructure/database/repositories/typeorm-language.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  controllers: [LanguageController],
  providers: [LanguageService, { provide: 'ILanguageRepository', useClass: TypeOrmLanguageRepository }],
})
export class LanguageModule {}
