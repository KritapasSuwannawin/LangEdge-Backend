import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Language } from '@/infrastructure/database/entities/language.entity';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';
import type { LanguageRecord } from '@/domain/language/language.record';

@Injectable()
export class TypeOrmLanguageRepository implements ILanguageRepository {
  constructor(
    @InjectRepository(Language)
    private readonly repo: Repository<Language>,
  ) {}

  async findById(id: number): Promise<LanguageRecord | null> {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) {
      return null;
    }
    return toLanguageRecord(entity);
  }

  async findByName(name: string): Promise<LanguageRecord | null> {
    const entity = await this.repo.findOne({ where: { name } });
    if (!entity) {
      return null;
    }
    return toLanguageRecord(entity);
  }

  async findAll(): Promise<LanguageRecord[]> {
    const entities = await this.repo.find();
    return entities.map(toLanguageRecord);
  }
}

function toLanguageRecord(entity: Language): LanguageRecord {
  return {
    id: entity.id,
    name: entity.name,
    code: entity.code,
  };
}
