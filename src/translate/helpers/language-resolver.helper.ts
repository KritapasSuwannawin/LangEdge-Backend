import { BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';

import { Language } from '../../infrastructure/database/entities/language.entity';
import { LLMService } from '../../infrastructure/services/llm.service';

import { LanguageContext } from '../types/translate.types';

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
      throw new BadRequestException('Invalid output language');
    }

    if (!languageAndCategory) {
      throw new Error('Failed to determine language and category');
    }

    if ('errorMessage' in languageAndCategory) {
      throw new BadRequestException(languageAndCategory.errorMessage);
    }

    const { language: originalLanguageName, category } = languageAndCategory;
    const isShortInputText = category === 'Word' || category === 'Phrase';

    const originalLanguage = await this.languageRepo.findOne({
      where: { name: originalLanguageName },
      select: { id: true },
    });

    if (!originalLanguage) {
      throw new BadRequestException('Unsupported input language');
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
