export interface TranslationResult {
  originalLanguageName: string;
  inputTextSynonymArr?: string[];
  translation: string;
  translationSynonymArr?: string[];
  exampleSentenceArr?: { sentence: string; translation: string }[];
}

export interface LanguageContext {
  originalLanguageId: number;
  originalLanguageName: string;
  outputLanguageId: number;
  outputLanguageName: string;
}

export interface CacheData {
  inputTextSynonymArr: string[];
  translationSynonymArr: string[];
  exampleSentenceArr: { sentence: string; translation: string }[];
}
