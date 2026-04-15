import { Injectable } from '@nestjs/common';

import type { GeneratedTranslationArtifacts } from '@/domain/translate/generated-translation-artifacts';
import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import type { GetTranslationInput, GetTranslationResult } from '@/use-cases/translate/get-translation.types';
import { GenerateTranslationArtifacts } from '@/use-cases/translate/collaborators/generate-translation-artifacts';
import { GetCachedTranslationQuery } from '@/use-cases/translate/collaborators/get-cached-translation.query';
import { PersistTranslationCache } from '@/use-cases/translate/collaborators/persist-translation-cache';
import { ResolveTranslationLanguageContext } from '@/use-cases/translate/collaborators/resolve-translation-language-context';

@Injectable()
export class GetTranslationUseCase {
  constructor(
    private readonly resolveTranslationLanguageContext: ResolveTranslationLanguageContext,
    private readonly getCachedTranslationQuery: GetCachedTranslationQuery,
    private readonly generateTranslationArtifacts: GenerateTranslationArtifacts,
    private readonly persistTranslationCache: PersistTranslationCache,
  ) {}

  async execute(input: GetTranslationInput): Promise<GetTranslationResult> {
    const context = await this.resolveTranslationLanguageContext.execute(input);

    if (isSameLanguage(context)) {
      return {
        originalLanguageName: context.originalLanguageName,
        translation: input.text,
      };
    }

    const cachedTranslation = await this.getCachedTranslationQuery.execute({ text: input.text, context });

    if (cachedTranslation) {
      return cachedTranslation;
    }

    const generatedArtifacts = await this.generateTranslationArtifacts.execute({ text: input.text, context });
    await this.persistTranslationCache.execute({ text: input.text, context, artifacts: generatedArtifacts });

    return buildTranslationOutput(context, generatedArtifacts);
  }
}

function isSameLanguage(context: ResolvedTranslationContext): boolean {
  return context.originalLanguageName.toLowerCase() === context.outputLanguageName.toLowerCase();
}

function buildTranslationOutput(
  context: ResolvedTranslationContext,
  generatedArtifacts: GeneratedTranslationArtifacts,
): GetTranslationResult {
  if (!context.isShortInputText) {
    return {
      originalLanguageName: context.originalLanguageName,
      translation: generatedArtifacts.translation,
    };
  }

  return {
    originalLanguageName: context.originalLanguageName,
    inputTextSynonymArr: generatedArtifacts.inputTextSynonymArr,
    translation: generatedArtifacts.translation,
    translationSynonymArr: generatedArtifacts.translationSynonymArr,
    exampleSentenceArr: generatedArtifacts.exampleSentenceArr,
  };
}
