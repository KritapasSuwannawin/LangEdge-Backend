import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import { Translation } from '@/infrastructure/database/entities/translation.entity';
import type { ITranslationCacheWriter, SaveShortTranslationCacheInput } from '@/repositories/translate/i-translation-cache-writer';

@Injectable()
export class TypeOrmTranslationCacheWriter implements ITranslationCacheWriter {
  constructor(private readonly dataSource: DataSource) {}

  async saveShortTranslationCache(input: SaveShortTranslationCacheInput): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const exampleSentenceTranslationIdArr = await this.saveExampleSentenceTranslations(queryRunner, input);

      await queryRunner.manager.save(ExampleSentence, {
        text: input.inputText,
        example_sentence_translation_id_arr: exampleSentenceTranslationIdArr,
        language_id: input.inputLanguageId,
        output_language_id: input.outputLanguageId,
      });

      await queryRunner.manager.save(Translation, {
        input_text: input.inputText,
        input_language_id: input.inputLanguageId,
        output_text: input.outputText,
        output_language_id: input.outputLanguageId,
      });

      await this.saveSynonymIfNotExists(queryRunner, input.inputText, input.inputTextSynonymArr, input.inputLanguageId);
      await this.saveSynonymIfNotExists(queryRunner, input.outputText, input.translationSynonymArr, input.outputLanguageId);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async saveExampleSentenceTranslations(queryRunner: QueryRunner, input: SaveShortTranslationCacheInput): Promise<number[]> {
    const exampleSentenceTranslationIdArr: number[] = [];

    for (const exampleSentence of input.exampleSentenceArr) {
      const entity = await queryRunner.manager.save(Translation, {
        input_text: exampleSentence.sentence,
        input_language_id: input.inputLanguageId,
        output_text: exampleSentence.translation,
        output_language_id: input.outputLanguageId,
      });

      exampleSentenceTranslationIdArr.push(entity.id);
    }

    return exampleSentenceTranslationIdArr;
  }

  private async saveSynonymIfNotExists(
    queryRunner: QueryRunner,
    text: string,
    synonymArr: ReadonlyArray<string>,
    languageId: number,
  ): Promise<void> {
    await queryRunner.manager
      .createQueryBuilder()
      .insert()
      .into(Synonym)
      .values({
        text,
        synonym_arr: [...synonymArr],
        language_id: languageId,
      })
      .orIgnore()
      .execute();
  }
}
