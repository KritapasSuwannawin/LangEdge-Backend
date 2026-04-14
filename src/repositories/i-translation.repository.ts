import type { TranslationRecord } from '@/domain/translate/translation.record';

export interface SaveTranslationInput {
  readonly inputText: string;
  readonly inputLanguageId: number;
  readonly outputText: string;
  readonly outputLanguageId: number;
}

export interface ITranslationRepository {
  findByInputAndLanguages(inputText: string, inputLanguageId: number, outputLanguageId: number): Promise<TranslationRecord | null>;
  save(data: SaveTranslationInput): Promise<TranslationRecord>;
}
