import { GetTranslationResponseDto } from '@/controllers/translate/dto/get-translation-response.dto';

interface ExampleSentenceResponseSource {
  readonly sentence: string;
  readonly translation: string;
}

interface TranslationResponseSource {
  readonly originalLanguageName: string;
  readonly inputTextSynonymArr?: ReadonlyArray<string>;
  readonly translation: string;
  readonly translationSynonymArr?: ReadonlyArray<string>;
  readonly exampleSentenceArr?: ReadonlyArray<ExampleSentenceResponseSource>;
}

export const mapGetTranslationResponse = (source: TranslationResponseSource): GetTranslationResponseDto => {
  return {
    originalLanguageName: source.originalLanguageName,
    inputTextSynonymArr: source.inputTextSynonymArr === undefined ? undefined : [...source.inputTextSynonymArr],
    translation: source.translation,
    translationSynonymArr: source.translationSynonymArr === undefined ? undefined : [...source.translationSynonymArr],
    exampleSentenceArr:
      source.exampleSentenceArr === undefined
        ? undefined
        : source.exampleSentenceArr.map((exampleSentence) => ({
            sentence: exampleSentence.sentence,
            translation: exampleSentence.translation,
          })),
  };
};
