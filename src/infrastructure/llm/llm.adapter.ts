import { Injectable } from '@nestjs/common';

import type { ILLMPort, LanguageAndCategory } from '@/domain/shared/ports/i-llm.port';
import { LLMService } from '@/infrastructure/services/llm.service';

@Injectable()
export class LLMAdapter implements ILLMPort {
  constructor(private readonly llmService: LLMService) {}

  async determineLanguageAndCategory(text: string): Promise<LanguageAndCategory | { errorMessage: 'Invalid input' } | null> {
    return this.llmService.determineLanguageAndCategory(text);
  }

  async translateTextAndGenerateSynonyms(
    text: string,
    isGenerateSynonyms: boolean,
    inputLanguage: string,
    outputLanguage: string,
  ): Promise<{ translation: string; synonyms: string[] } | null> {
    return this.llmService.translateTextAndGenerateSynonyms(text, isGenerateSynonyms, inputLanguage, outputLanguage);
  }

  async generateSynonyms(text: string, language: string): Promise<string[] | null> {
    return this.llmService.generateSynonyms(text, language);
  }

  async generateExampleSentences(
    text: string,
    inputLanguage: string,
    translationLanguage: string,
  ): Promise<Array<{ sentence: string; translation: string }> | null> {
    return this.llmService.generateExampleSentences(text, inputLanguage, translationLanguage);
  }
}
