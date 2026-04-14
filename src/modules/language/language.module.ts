import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LanguageController } from '@/controllers/language/language.controller';
import { Language } from '@/infrastructure/database/entities/language.entity';
import { TypeOrmLanguageRepository } from '@/infrastructure/database/repositories/typeorm-language.repository';
import { GetLanguagesUseCase } from '@/use-cases/language/get-languages.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Language])],
  controllers: [LanguageController],
  providers: [GetLanguagesUseCase, { provide: 'ILanguageRepository', useClass: TypeOrmLanguageRepository }],
})
export class LanguageModule {}
