export interface ExampleSentenceResponseDto {
  readonly sentence: string;
  readonly translation: string;
}

export interface GetTranslationResponseDto {
  readonly originalLanguageName: string;
  readonly inputTextSynonymArr?: ReadonlyArray<string>;
  readonly translation: string;
  readonly translationSynonymArr?: ReadonlyArray<string>;
  readonly exampleSentenceArr?: ReadonlyArray<ExampleSentenceResponseDto>;
}
