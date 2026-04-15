import { Inject, Injectable } from '@nestjs/common';

import type { TranslationOutput } from '@/domain/translate/translation-output';
import type { IExampleSentenceRepository } from '@/repositories/translate/i-example-sentence.repository';
import type { ISynonymRepository } from '@/repositories/translate/i-synonym.repository';
import type { ITranslationRepository } from '@/repositories/translate/i-translation.repository';
import type { TranslationWorkflowInput } from '@/use-cases/translate/get-translation.types';

@Injectable()
export class GetCachedTranslationQuery {
  constructor(
    @Inject('ITranslationRepository') private readonly translationRepository: ITranslationRepository,
    @Inject('ISynonymRepository') private readonly synonymRepository: ISynonymRepository,
    @Inject('IExampleSentenceRepository') private readonly exampleSentenceRepository: IExampleSentenceRepository,
  ) {}

  async execute(input: TranslationWorkflowInput): Promise<TranslationOutput | null> {
    const translationRecord = await this.translationRepository.findByInputAndLanguages(
      input.text,
      input.context.originalLanguageId,
      input.context.outputLanguageId,
    );

    if (!translationRecord) {
      return null;
    }

    if (!input.context.isShortInputText) {
      return {
        originalLanguageName: input.context.originalLanguageName,
        translation: translationRecord.outputText,
      };
    }

    return this.getShortTextCacheOutput(input, translationRecord.outputText);
  }

  private async getShortTextCacheOutput(input: TranslationWorkflowInput, translation: string): Promise<TranslationOutput | null> {
    const [inputSynonymRecord, translationSynonymRecord, exampleSentenceRecord] = await Promise.all([
      this.synonymRepository.findByTextAndLanguage(input.text, input.context.originalLanguageId),
      this.synonymRepository.findByTextAndLanguage(translation, input.context.outputLanguageId),
      this.exampleSentenceRepository.findByTextAndLanguages(input.text, input.context.originalLanguageId, input.context.outputLanguageId),
    ]);

    if (!inputSynonymRecord || !translationSynonymRecord || !exampleSentenceRecord) {
      return null;
    }

    if (
      inputSynonymRecord.synonymArr.length === 0 ||
      translationSynonymRecord.synonymArr.length === 0 ||
      exampleSentenceRecord.exampleSentenceTranslationIdArr.length === 0
    ) {
      return null;
    }

    const exampleSentenceTranslations = await this.translationRepository.findByIds(exampleSentenceRecord.exampleSentenceTranslationIdArr);

    if (exampleSentenceTranslations.length !== exampleSentenceRecord.exampleSentenceTranslationIdArr.length) {
      return null;
    }

    return {
      originalLanguageName: input.context.originalLanguageName,
      inputTextSynonymArr: [...inputSynonymRecord.synonymArr],
      translation,
      translationSynonymArr: [...translationSynonymRecord.synonymArr],
      exampleSentenceArr: exampleSentenceTranslations.map((record) => ({
        sentence: record.inputText,
        translation: record.outputText,
      })),
    };
  }
}
