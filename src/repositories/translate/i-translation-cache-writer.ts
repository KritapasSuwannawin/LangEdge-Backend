export interface SaveShortTranslationCacheInput {
  readonly inputText: string;
  readonly inputLanguageId: number;
  readonly outputText: string;
  readonly outputLanguageId: number;
  readonly inputTextSynonymArr: ReadonlyArray<string>;
  readonly translationSynonymArr: ReadonlyArray<string>;
  readonly exampleSentenceArr: ReadonlyArray<{
    readonly sentence: string;
    readonly translation: string;
  }>;
}

export interface ITranslationCacheWriter {
  saveShortTranslationCache(input: SaveShortTranslationCacheInput): Promise<void>;
}
