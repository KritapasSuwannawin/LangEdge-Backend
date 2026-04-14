import type { LanguageRecord } from '@/domain/language/language.record';

export interface ILanguageRepository {
  findById(id: number): Promise<LanguageRecord | null>;
  findAll(): Promise<LanguageRecord[]>;
}
