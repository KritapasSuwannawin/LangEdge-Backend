export interface LanguageResponseDto {
  readonly id: number;
  readonly name: string;
  readonly code: string;
}

export interface GetLanguageResponseDto {
  readonly languageArr: ReadonlyArray<LanguageResponseDto>;
}
