export interface TranslationOutput {
  readonly originalLanguageName: string;
  readonly inputTextSynonymArr?: ReadonlyArray<string>;
  readonly translation: string;
  readonly translationSynonymArr?: ReadonlyArray<string>;
  readonly exampleSentenceArr?: ReadonlyArray<{
    readonly sentence: string;
    readonly translation: string;
  }>;
}
