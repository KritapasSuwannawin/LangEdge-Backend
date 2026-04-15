import { Inject, Injectable } from '@nestjs/common';

import type { LinguisticCategory, ILLMPort } from '@/domain/shared/ports/i-llm.port';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { InvalidOutputLanguageError } from '@/domain/translate/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from '@/domain/translate/errors/language-detection-failed.error';
import type { ResolvedTranslationContext } from '@/domain/translate/resolved-translation-context';
import { UnsupportedInputLanguageError } from '@/domain/translate/errors/unsupported-input-language.error';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';
import type { GetTranslationInput } from '@/use-cases/translate/get-translation.types';

@Injectable()
export class ResolveTranslationLanguageContext {
  constructor(
    @Inject('ILanguageRepository') private readonly languageRepository: ILanguageRepository,
    @Inject('ILLMPort') private readonly llmPort: ILLMPort,
  ) {}

  async execute(input: GetTranslationInput): Promise<ResolvedTranslationContext> {
    const [outputLanguage, languageAndCategory] = await Promise.all([
      this.languageRepository.findById(input.outputLanguageId),
      this.llmPort.determineLanguageAndCategory(input.text),
    ]);

    if (!outputLanguage) {
      throw new InvalidOutputLanguageError();
    }

    if (!languageAndCategory) {
      throw new LanguageDetectionFailedError();
    }

    if ('errorMessage' in languageAndCategory) {
      throw new ValidationAppError({
        publicMessage: languageAndCategory.errorMessage,
        details: [{ field: 'text', message: languageAndCategory.errorMessage }],
      });
    }

    const originalLanguage = await this.languageRepository.findByName(languageAndCategory.language);

    if (!originalLanguage) {
      throw new UnsupportedInputLanguageError();
    }

    return {
      originalLanguageId: originalLanguage.id,
      originalLanguageName: languageAndCategory.language,
      outputLanguageId: input.outputLanguageId,
      outputLanguageName: outputLanguage.name,
      isShortInputText: isShortInputText(languageAndCategory.category),
    };
  }
}

function isShortInputText(category: LinguisticCategory): boolean {
  return category === 'Word' || category === 'Phrase';
}
