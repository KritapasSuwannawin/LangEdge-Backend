import { Repository } from 'typeorm';

import { Language } from '@/infrastructure/database/entities/language.entity';
import { ValidationAppError } from '@/shared/domain/errors/validation-app-error';
import { InvalidOutputLanguageError } from '@/translate/domain/errors/invalid-output-language.error';
import { LanguageDetectionFailedError } from '@/translate/domain/errors/language-detection-failed.error';
import { UnsupportedInputLanguageError } from '@/translate/domain/errors/unsupported-input-language.error';
import { LLMService } from '@/infrastructure/services/llm.service';
import { LanguageContext } from '@/translate/types/translate.types';

export class LanguageResolverHelper {
  constructor(
    private readonly languageRepo: Repository<Language>,
    private readonly llmService: LLMService,
  ) {}

  async resolveLanguageContext(
    text: string,
    outputLanguageId: number,
  ): Promise<{ languageContext: LanguageContext; isShortInputText: boolean }> {
    const [[outputLanguage], languageAndCategory] = await Promise.all([
      this.languageRepo.find({ where: { id: outputLanguageId }, select: { name: true } }),
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

    const originalLanguage = await this.languageRepo.findOne({
      where: { name: originalLanguageName },
      select: { id: true },
    });

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
