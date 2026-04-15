import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TranslateController } from '@/controllers/translate/translate.controller';
import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import { Language } from '@/infrastructure/database/entities/language.entity';
import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import { Translation } from '@/infrastructure/database/entities/translation.entity';
import { TypeOrmExampleSentenceRepository } from '@/infrastructure/database/repositories/typeorm-example-sentence.repository';
import { TypeOrmLanguageRepository } from '@/infrastructure/database/repositories/typeorm-language.repository';
import { TypeOrmSynonymRepository } from '@/infrastructure/database/repositories/typeorm-synonym.repository';
import { TypeOrmTranslationCacheWriter } from '@/infrastructure/database/repositories/typeorm-translation-cache-writer';
import { TypeOrmTranslationRepository } from '@/infrastructure/database/repositories/typeorm-translation.repository';
import { LLMInfraModule } from '@/infrastructure/llm/llm-infra.module';
import { GenerateTranslationArtifacts } from '@/use-cases/translate/collaborators/generate-translation-artifacts';
import { GetCachedTranslationQuery } from '@/use-cases/translate/collaborators/get-cached-translation.query';
import { PersistTranslationCache } from '@/use-cases/translate/collaborators/persist-translation-cache';
import { ResolveTranslationLanguageContext } from '@/use-cases/translate/collaborators/resolve-translation-language-context';
import { GetTranslationUseCase } from '@/use-cases/translate/get-translation.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Translation, Synonym, ExampleSentence, Language]), LLMInfraModule],
  controllers: [TranslateController],
  providers: [
    ResolveTranslationLanguageContext,
    GetCachedTranslationQuery,
    GenerateTranslationArtifacts,
    PersistTranslationCache,
    GetTranslationUseCase,
    { provide: 'ITranslationRepository', useClass: TypeOrmTranslationRepository },
    { provide: 'ISynonymRepository', useClass: TypeOrmSynonymRepository },
    { provide: 'IExampleSentenceRepository', useClass: TypeOrmExampleSentenceRepository },
    { provide: 'ITranslationCacheWriter', useClass: TypeOrmTranslationCacheWriter },
    { provide: 'ILanguageRepository', useClass: TypeOrmLanguageRepository },
  ],
})
export class TranslateModule {}
