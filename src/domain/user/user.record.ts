export interface UserRecord {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
  readonly createdAt: Date;
  readonly lastUsedLanguageId: number | null;
}
