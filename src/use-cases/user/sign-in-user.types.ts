export interface SignInUserInput {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | undefined;
}

export interface SignInUserResult {
  readonly pictureUrl: string | undefined;
  readonly lastUsedLanguageId: number | undefined;
}
