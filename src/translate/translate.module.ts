import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Language } from '../infrastructure/database/entities/language.entity';
import { Translation } from '../infrastructure/database/entities/translation.entity';
import { Synonym } from '../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../infrastructure/database/entities/example-sentence.entity';

import { AuthModule } from '../auth/auth.module';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';

@Module({
  imports: [TypeOrmModule.forFeature([Language, Translation, Synonym, ExampleSentence]), InfrastructureModule, AuthModule],
  controllers: [TranslateController],
  providers: [TranslateService],
})
export class TranslateModule {}
