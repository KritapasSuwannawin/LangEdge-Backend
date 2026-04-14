import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Translation } from '@/infrastructure/database/entities/translation.entity';
import type { ITranslationRepository, SaveTranslationInput } from '@/repositories/translate/i-translation.repository';
import type { TranslationRecord } from '@/domain/translate/translation.record';

@Injectable()
export class TypeOrmTranslationRepository implements ITranslationRepository {
  constructor(
    @InjectRepository(Translation)
    private readonly repo: Repository<Translation>,
  ) {}

  async findByInputAndLanguages(inputText: string, inputLanguageId: number, outputLanguageId: number): Promise<TranslationRecord | null> {
    const entity = await this.repo.findOne({
      where: {
        input_text: inputText,
        input_language_id: inputLanguageId,
        output_language_id: outputLanguageId,
      },
    });
    if (!entity) {
      return null;
    }
    return toTranslationRecord(entity);
  }

  async save(data: SaveTranslationInput): Promise<TranslationRecord> {
    const created = this.repo.create({
      input_text: data.inputText,
      input_language_id: data.inputLanguageId,
      output_text: data.outputText,
      output_language_id: data.outputLanguageId,
    });
    const saved = await this.repo.save(created);
    return toTranslationRecord(saved);
  }
}

function toTranslationRecord(entity: Translation): TranslationRecord {
  return {
    id: entity.id,
    inputText: entity.input_text,
    inputLanguageId: entity.input_language_id,
    outputText: entity.output_text,
    outputLanguageId: entity.output_language_id,
    createdAt: entity.created_at,
  };
}
