import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import type { ISynonymRepository, SaveSynonymInput } from '@/repositories/translate/i-synonym.repository';
import type { SynonymRecord } from '@/domain/translate/synonym.record';

@Injectable()
export class TypeOrmSynonymRepository implements ISynonymRepository {
  constructor(
    @InjectRepository(Synonym)
    private readonly repo: Repository<Synonym>,
  ) {}

  async findByTextAndLanguage(text: string, languageId: number): Promise<SynonymRecord | null> {
    const entity = await this.repo.findOne({
      where: { text, language_id: languageId },
    });
    if (!entity) {
      return null;
    }
    return toSynonymRecord(entity);
  }

  async save(data: SaveSynonymInput): Promise<SynonymRecord> {
    const created = this.repo.create({
      text: data.text,
      synonym_arr: data.synonymArr,
      language_id: data.languageId,
    });
    const saved = await this.repo.save(created);
    return toSynonymRecord(saved);
  }
}

function toSynonymRecord(entity: Synonym): SynonymRecord {
  return {
    id: entity.id,
    text: entity.text,
    synonymArr: entity.synonym_arr,
    languageId: entity.language_id,
  };
}
