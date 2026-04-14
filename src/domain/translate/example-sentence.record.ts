export interface ExampleSentenceRecord {
  readonly id: number;
  readonly text: string;
  readonly exampleSentenceTranslationIdArr: number[];
  readonly languageId: number;
  readonly outputLanguageId: number;
}
