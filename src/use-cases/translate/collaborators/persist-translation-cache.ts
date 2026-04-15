import { Inject, Injectable } from '@nestjs/common';

import type { ITranslationCacheWriter } from '@/repositories/translate/i-translation-cache-writer';
import { logError } from '@/shared/utils/systemUtils';
import type { PersistTranslationCacheInput } from '@/use-cases/translate/get-translation.types';

@Injectable()
export class PersistTranslationCache {
  constructor(@Inject('ITranslationCacheWriter') private readonly translationCacheWriter: ITranslationCacheWriter) {}

  async execute(input: PersistTranslationCacheInput): Promise<void> {
    if (!input.context.isShortInputText || !hasCompleteShortTextArtifacts(input)) {
      return;
    }

    try {
      await this.translationCacheWriter.saveShortTranslationCache({
        inputText: input.text,
        inputLanguageId: input.context.originalLanguageId,
        outputText: input.artifacts.translation,
        outputLanguageId: input.context.outputLanguageId,
        inputTextSynonymArr: input.artifacts.inputTextSynonymArr,
        translationSynonymArr: input.artifacts.translationSynonymArr,
        exampleSentenceArr: input.artifacts.exampleSentenceArr,
      });
    } catch (error) {
      logError('PersistTranslationCache.execute', error, {
        inputLanguageId: input.context.originalLanguageId,
        outputLanguageId: input.context.outputLanguageId,
      });
    }
  }
}

function hasCompleteShortTextArtifacts(input: PersistTranslationCacheInput): boolean {
  return (
    input.artifacts.inputTextSynonymArr.length > 0 &&
    input.artifacts.translationSynonymArr.length > 0 &&
    input.artifacts.exampleSentenceArr.length > 0
  );
}
