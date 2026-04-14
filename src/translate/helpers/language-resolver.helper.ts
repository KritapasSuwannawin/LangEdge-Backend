import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { InvalidOutputLanguageError } from '@/domain/translate/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from '@/domain/translate/errors/language-detection-failed.error';
import { UnsupportedInputLanguageError } from '@/domain/translate/errors/unsupported-input-language.error';
import { LLMService } from '@/infrastructure/services/llm.service';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';
import { LanguageContext } from '@/translate/types/translate.types';

export class LanguageResolverHelper {
  constructor(
    private readonly languageRepository: ILanguageRepository,
    private readonly llmService: LLMService,
  ) {}

  async resolveLanguageContext(
    text: string,
    outputLanguageId: number,
  ): Promise<{ languageContext: LanguageContext; isShortInputText: boolean }> {
    const [[outputLanguage], languageAndCategory] = await Promise.all([
      Promise.all([this.languageRepository.findById(outputLanguageId)]),
      this.llmService.determineLanguageAndCategory(text),
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

    const { language: originalLanguageName, category } = languageAndCategory;
    const isShortInputText = category === 'Word' || category === 'Phrase';

    const originalLanguage = (await this.languageRepository.findAll()).find((language) => language.name === originalLanguageName);

    if (!originalLanguage) {
      throw new UnsupportedInputLanguageError();
    }

    return {
      languageContext: {
        originalLanguageId: originalLanguage.id,
        originalLanguageName,
        outputLanguageId,
        outputLanguageName: outputLanguage.name,
      },
      isShortInputText,
    };
  }
}
