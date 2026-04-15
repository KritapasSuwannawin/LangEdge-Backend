export interface GeneratedTranslationArtifacts {
  readonly translation: string;
  readonly inputTextSynonymArr: ReadonlyArray<string>;
  readonly translationSynonymArr: ReadonlyArray<string>;
  readonly exampleSentenceArr: ReadonlyArray<{
    readonly sentence: string;
    readonly translation: string;
  }>;
}
