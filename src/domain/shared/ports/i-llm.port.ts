export type LinguisticCategory = 'Word' | 'Phrase' | 'Sentence' | 'Paragraph';

export interface LanguageAndCategory {
  readonly language: string;
  readonly category: LinguisticCategory;
}

export interface ILLMPort {
  determineLanguageAndCategory(text: string): Promise<LanguageAndCategory | { errorMessage: 'Invalid input' } | null>;

  translateTextAndGenerateSynonyms(
    text: string,
    isGenerateSynonyms: boolean,
    inputLanguage: string,
    outputLanguage: string,
  ): Promise<{ translation: string; synonyms: string[] } | null>;

  generateSynonyms(text: string, language: string): Promise<string[] | null>;

  generateExampleSentences(
    text: string,
    inputLanguage: string,
    translationLanguage: string,
  ): Promise<Array<{ sentence: string; translation: string }> | null>;
}
