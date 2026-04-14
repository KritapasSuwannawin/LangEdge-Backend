export interface SignInUserResponseDto {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl?: string;
  readonly lastUsedLanguageId?: number;
}
