import type { SynonymRecord } from '@/domain/translate/synonym.record';

export interface SaveSynonymInput {
  readonly text: string;
  readonly synonymArr: string[];
  readonly languageId: number;
}

export interface ISynonymRepository {
  findByTextAndLanguage(text: string, languageId: number): Promise<SynonymRecord | null>;
  save(data: SaveSynonymInput): Promise<SynonymRecord>;
}
