import { DataSource, Repository } from 'typeorm';

import { Translation } from '../../infrastructure/database/entities/translation.entity';
import { Synonym } from '../../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../../infrastructure/database/entities/example-sentence.entity';

import { TranslationResult, LanguageContext, CacheData } from '../types/translate.types';

export class TranslationCacheHelper {
  constructor(
    private readonly translationRepo: Repository<Translation>,
    private readonly synonymRepo: Repository<Synonym>,
    private readonly exampleSentenceRepo: Repository<ExampleSentence>,
    private readonly dataSource: DataSource,
  ) {}

  async findCachedTranslation(text: string, context: LanguageContext, isShortInputText: boolean): Promise<TranslationResult | null> {
    const { originalLanguageId, originalLanguageName, outputLanguageId } = context;

    const existingTranslation = await this.translationRepo.findOne({
      where: { input_text: text, input_language_id: originalLanguageId, output_language_id: outputLanguageId },
      select: { output_text: true, id: true },
    });

    if (!existingTranslation) {
      return null;
    }

    const translation = existingTranslation.output_text;

    if (!isShortInputText) {
      return { originalLanguageName, translation };
    }

    return this.enrichWithSynonymsAndExamples(text, translation, context);
  }

  async enrichWithSynonymsAndExamples(text: string, translation: string, context: LanguageContext): Promise<TranslationResult | null> {
    const { originalLanguageId, originalLanguageName, outputLanguageId } = context;

    const [inputSyn, outputSyn, example] = await Promise.all([
      this.synonymRepo.findOne({ where: { text, language_id: originalLanguageId }, select: { synonym_arr: true } }),
      this.synonymRepo.findOne({ where: { text: translation, language_id: outputLanguageId }, select: { synonym_arr: true } }),
      this.exampleSentenceRepo.findOne({
        where: { text, language_id: originalLanguageId, output_language_id: outputLanguageId },
        select: { example_sentence_translation_id_arr: true },
      }),
    ]);

    if (!inputSyn || !outputSyn || !example) {
      return null;
    }

    const exampleTranslations = await this.translationRepo.find({
      where: example.example_sentence_translation_id_arr.map((id) => ({ id })),
      select: { input_text: true, output_text: true },
    });

    return {
      originalLanguageName,
      inputTextSynonymArr: inputSyn.synonym_arr,
      translation,
      translationSynonymArr: outputSyn.synonym_arr,
      exampleSentenceArr: exampleTranslations.map(({ input_text, output_text }) => ({
        sentence: input_text,
        translation: output_text,
      })),
    };
  }

  async cacheTranslationData(text: string, translation: string, context: LanguageContext, data: CacheData) {
    const { inputTextSynonymArr, translationSynonymArr, exampleSentenceArr } = data;
    const { originalLanguageId, outputLanguageId } = context;

    // Only cache if we have complete data for short text
    if (!inputTextSynonymArr.length || !translationSynonymArr.length || !exampleSentenceArr.length) {
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Save example sentence translations
      const exampleSentenceTranslationIdArr: number[] = [];
      for (const { sentence, translation } of exampleSentenceArr) {
        const entity = await queryRunner.manager.save(Translation, {
          input_text: sentence,
          input_language_id: originalLanguageId,
          output_text: translation,
          output_language_id: outputLanguageId,
        });
        exampleSentenceTranslationIdArr.push(entity.id);
      }

      // Save example sentence reference
      await queryRunner.manager.save(ExampleSentence, {
        text,
        example_sentence_translation_id_arr: exampleSentenceTranslationIdArr,
        language_id: originalLanguageId,
        output_language_id: outputLanguageId,
      });

      // Save main translation
      await queryRunner.manager.save(Translation, {
        input_text: text,
        input_language_id: originalLanguageId,
        output_text: translation,
        output_language_id: outputLanguageId,
      });

      // Save synonyms (ignore duplicates)
      await this.saveSynonymIfNotExists(queryRunner, text, inputTextSynonymArr, originalLanguageId);
      await this.saveSynonymIfNotExists(queryRunner, translation, translationSynonymArr, outputLanguageId);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async saveSynonymIfNotExists(
    queryRunner: ReturnType<DataSource['createQueryRunner']>,
    text: string,
    synonymArr: string[],
    languageId: number,
  ): Promise<void> {
    try {
      await queryRunner.manager.save(Synonym, { text, synonym_arr: synonymArr, language_id: languageId });
    } catch (error) {
      // Ignore duplicate key errors
      if (!error.message?.includes('duplicate key value')) {
        throw error;
      }
    }
  }
}
