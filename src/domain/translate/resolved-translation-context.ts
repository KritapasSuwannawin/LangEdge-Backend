export interface ResolvedTranslationContext {
  readonly originalLanguageId: number;
  readonly originalLanguageName: string;
  readonly outputLanguageId: number;
  readonly outputLanguageName: string;
  readonly isShortInputText: boolean;
}
