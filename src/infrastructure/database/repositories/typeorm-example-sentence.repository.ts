import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import type { IExampleSentenceRepository, SaveExampleSentenceInput } from '@/repositories/translate/i-example-sentence.repository';
import type { ExampleSentenceRecord } from '@/domain/translate/example-sentence.record';

@Injectable()
export class TypeOrmExampleSentenceRepository implements IExampleSentenceRepository {
  constructor(
    @InjectRepository(ExampleSentence)
    private readonly repo: Repository<ExampleSentence>,
  ) {}

  async findByTextAndLanguages(text: string, languageId: number, outputLanguageId: number): Promise<ExampleSentenceRecord | null> {
    const entity = await this.repo.findOne({
      where: { text, language_id: languageId, output_language_id: outputLanguageId },
    });
    if (!entity) {
      return null;
    }
    return toExampleSentenceRecord(entity);
  }

  async save(data: SaveExampleSentenceInput): Promise<ExampleSentenceRecord> {
    const created = this.repo.create({
      text: data.text,
      language_id: data.languageId,
      output_language_id: data.outputLanguageId,
      example_sentence_translation_id_arr: data.exampleSentenceTranslationIdArr,
    });
    const saved = await this.repo.save(created);
    return toExampleSentenceRecord(saved);
  }
}

function toExampleSentenceRecord(entity: ExampleSentence): ExampleSentenceRecord {
  return {
    id: entity.id,
    text: entity.text,
    exampleSentenceTranslationIdArr: entity.example_sentence_translation_id_arr,
    languageId: entity.language_id,
    outputLanguageId: entity.output_language_id,
  };
}
