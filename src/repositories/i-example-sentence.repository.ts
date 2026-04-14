import type { ExampleSentenceRecord } from '@/domain/translate/example-sentence.record';

export interface SaveExampleSentenceInput {
  readonly text: string;
  readonly languageId: number;
  readonly outputLanguageId: number;
  readonly exampleSentenceTranslationIdArr: number[];
}

export interface IExampleSentenceRepository {
  findByTextAndLanguages(text: string, languageId: number, outputLanguageId: number): Promise<ExampleSentenceRecord | null>;
  save(data: SaveExampleSentenceInput): Promise<ExampleSentenceRecord>;
}
