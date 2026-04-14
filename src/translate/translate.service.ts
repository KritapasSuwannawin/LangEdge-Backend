import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';

import { Translation } from '../infrastructure/database/entities/translation.entity';
import { Synonym } from '../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../infrastructure/database/entities/example-sentence.entity';

import { logError } from '../shared/utils/systemUtils';
import { LLMService } from '../infrastructure/services/llm.service';
import { TranslationFailedError } from '@/domain/translate/errors/translation-failed.error';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';

import { GetTranslationDto } from '@/controllers/translate/dto/get-translation.dto';
import { TranslationResult, LanguageContext } from './types/translate.types';
import { LanguageResolverHelper, TranslationCacheHelper } from './helpers';

@Injectable()
export class TranslateService {
  private readonly languageResolver: LanguageResolverHelper;
  private readonly translationCache: TranslationCacheHelper;

  constructor(
    @Inject('ILanguageRepository') private readonly languageRepository: ILanguageRepository,
    @InjectRepository(Translation) private readonly translationRepo: Repository<Translation>,
    @InjectRepository(Synonym) private readonly synonymRepo: Repository<Synonym>,
    @InjectRepository(ExampleSentence) private readonly exampleSentenceRepo: Repository<ExampleSentence>,
    private readonly llmService: LLMService,
    private readonly dataSource: DataSource,
  ) {
    this.languageResolver = new LanguageResolverHelper(this.languageRepository, this.llmService);
    this.translationCache = new TranslationCacheHelper(this.translationRepo, this.synonymRepo, this.exampleSentenceRepo, this.dataSource);
  }

  async getTranslation(query: GetTranslationDto): Promise<TranslationResult> {
    const { text, outputLanguageId } = query;

    const { languageContext, isShortInputText } = await this.languageResolver.resolveLanguageContext(text, outputLanguageId);
    const { originalLanguageName, outputLanguageName } = languageContext;

    // If languages are the same, return input text as-is
    if (originalLanguageName.toLowerCase() === outputLanguageName.toLowerCase()) {
      return { originalLanguageName, translation: text };
    }

    // Try to find cached translation
    const cachedResult = await this.translationCache.findCachedTranslation(text, languageContext, isShortInputText);
    if (cachedResult) {
      return cachedResult;
    }

    // Generate new translation via LLM
    return this.generateAndCacheTranslation(text, languageContext, isShortInputText);
  }

  private async generateAndCacheTranslation(text: string, context: LanguageContext, isShortInputText: boolean): Promise<TranslationResult> {
    const { originalLanguageName, outputLanguageName } = context;

    const [translatedTextAndSynonyms, inputTextSynonymArr, exampleSentenceArr] = await Promise.all([
      this.llmService.translateTextAndGenerateSynonyms(text, isShortInputText, originalLanguageName, outputLanguageName),
      isShortInputText ? this.llmService.generateSynonyms(text, originalLanguageName) : Promise.resolve([]),
      isShortInputText ? this.llmService.generateExampleSentences(text, originalLanguageName, outputLanguageName) : Promise.resolve([]),
    ]);

    if (!translatedTextAndSynonyms) {
      throw new TranslationFailedError();
    }

    const { translation, synonyms: translationSynonymArr } = translatedTextAndSynonyms;

    // Normalize null values to empty arrays
    const normalizedInputSynonyms = inputTextSynonymArr ?? [];
    const normalizedExampleSentences = exampleSentenceArr ?? [];

    // Cache results in background (fire-and-forget)
    this.translationCache
      .cacheTranslationData(text, translation, context, {
        inputTextSynonymArr: normalizedInputSynonyms,
        translationSynonymArr,
        exampleSentenceArr: normalizedExampleSentences,
      })
      .catch((error) => {
        logError('cacheTranslationData', error);
      });

    return {
      originalLanguageName,
      inputTextSynonymArr: isShortInputText ? normalizedInputSynonyms : undefined,
      translation,
      translationSynonymArr: isShortInputText ? translationSynonymArr : undefined,
      exampleSentenceArr: isShortInputText ? normalizedExampleSentences : undefined,
    };
  }
}
