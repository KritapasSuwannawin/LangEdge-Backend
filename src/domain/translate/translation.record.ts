export interface TranslationRecord {
  readonly id: number;
  readonly inputText: string;
  readonly inputLanguageId: number;
  readonly outputText: string;
  readonly outputLanguageId: number;
  readonly createdAt: Date;
}
