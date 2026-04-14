import type { UserRecord } from '@/domain/user/user.record';

export interface UpsertUserInput {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<UserRecord | null>;
  upsert(data: UpsertUserInput): Promise<UserRecord>;
  updateLastUsedLanguageId(userId: string, languageId: number | null): Promise<void>;
}
