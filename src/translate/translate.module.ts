import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranslateController } from './translate.controller';
import { TranslateService } from './translate.service';

import { Translation } from '@/infrastructure/database/entities/translation.entity';
import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import { Language } from '@/infrastructure/database/entities/language.entity';
import { LLMInfraModule } from '@/infrastructure/llm/llm-infra.module';
import { TypeOrmTranslationRepository } from '@/infrastructure/database/repositories/typeorm-translation.repository';
import { TypeOrmSynonymRepository } from '@/infrastructure/database/repositories/typeorm-synonym.repository';
import { TypeOrmExampleSentenceRepository } from '@/infrastructure/database/repositories/typeorm-example-sentence.repository';
import { TypeOrmLanguageRepository } from '@/infrastructure/database/repositories/typeorm-language.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Translation, Synonym, ExampleSentence, Language]), LLMInfraModule],
  controllers: [TranslateController],
  providers: [
    TranslateService,
    { provide: 'ITranslationRepository', useClass: TypeOrmTranslationRepository },
    { provide: 'ISynonymRepository', useClass: TypeOrmSynonymRepository },
    { provide: 'IExampleSentenceRepository', useClass: TypeOrmExampleSentenceRepository },
    { provide: 'ILanguageRepository', useClass: TypeOrmLanguageRepository },
  ],
})
export class TranslateModule {}
