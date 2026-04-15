import { Inject, Injectable } from '@nestjs/common';

import type { ILLMPort } from '@/domain/shared/ports/i-llm.port';
import type { GeneratedTranslationArtifacts } from '@/domain/translate/generated-translation-artifacts';
import { TranslationFailedError } from '@/domain/translate/errors/translation-failed.error';
import type { TranslationWorkflowInput } from '@/use-cases/translate/get-translation.types';

@Injectable()
export class GenerateTranslationArtifacts {
  constructor(@Inject('ILLMPort') private readonly llmPort: ILLMPort) {}

  async execute(input: TranslationWorkflowInput): Promise<GeneratedTranslationArtifacts> {
    const [translationResult, inputTextSynonymArr, exampleSentenceArr] = await Promise.all([
      this.llmPort.translateTextAndGenerateSynonyms(
        input.text,
        input.context.isShortInputText,
        input.context.originalLanguageName,
        input.context.outputLanguageName,
      ),
      input.context.isShortInputText ? this.llmPort.generateSynonyms(input.text, input.context.originalLanguageName) : Promise.resolve([]),
      input.context.isShortInputText
        ? this.llmPort.generateExampleSentences(input.text, input.context.originalLanguageName, input.context.outputLanguageName)
        : Promise.resolve([]),
    ]);

    if (!translationResult) {
      throw new TranslationFailedError();
    }

    return {
      translation: translationResult.translation,
      inputTextSynonymArr: inputTextSynonymArr ?? [],
      translationSynonymArr: translationResult.synonyms ?? [],
      exampleSentenceArr: exampleSentenceArr ?? [],
    };
  }
}
