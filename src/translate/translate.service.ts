import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Language } from '../infrastructure/database/entities/language.entity';
import { Translation } from '../infrastructure/database/entities/translation.entity';
import { Synonym } from '../infrastructure/database/entities/synonym.entity';
import { ExampleSentence } from '../infrastructure/database/entities/example-sentence.entity';

import { logError } from '../shared/utils/systemUtils';
import { LLMService } from '../infrastructure/services/llm.service';

import { GetTranslationDto } from './dto/get-translation.dto';

@Injectable()
export class TranslateService {
  constructor(
    @InjectRepository(Language) private readonly languageRepo: Repository<Language>,
    @InjectRepository(Translation) private readonly translationRepo: Repository<Translation>,
    @InjectRepository(Synonym) private readonly synonymRepo: Repository<Synonym>,
    @InjectRepository(ExampleSentence) private readonly exampleSentenceRepo: Repository<ExampleSentence>,
    private readonly llmService: LLMService,
  ) {}

  async getTranslation(query: GetTranslationDto): Promise<{
    originalLanguageName: string;
    inputTextSynonymArr?: string[];
    translation: string;
    translationSynonymArr?: string[];
    exampleSentenceArr?: {
      sentence: string;
      translation: string;
    }[];
  }> {
    const { text, outputLanguageId } = query;

    // Fetch output language name and determine language/category via LLM
    const [[outputLanguage], languageAndCategory] = await Promise.all([
      this.languageRepo.find({ where: { id: outputLanguageId }, select: { name: true } }),
      this.llmService.determineLanguageAndCategory(text),
    ]);

    if (!outputLanguage) {
      throw new BadRequestException('Bad request');
    }

    if (!languageAndCategory) {
      throw new Error('Failed to determine language and category');
    }

    if ('errorMessage' in languageAndCategory) {
      throw new BadRequestException(languageAndCategory.errorMessage);
    }

    const { language: originalLanguageName, category } = languageAndCategory;
    const isShortInputText = category === 'Word' || category === 'Phrase';

    // Get original language id
    const originalLanguage = await this.languageRepo.findOne({ where: { name: originalLanguageName }, select: { id: true } });
    if (!originalLanguage) {
      throw new BadRequestException('Bad request');
    }

    // If languages are the same, return input text
    if (originalLanguageName.toLowerCase() === outputLanguage.name.toLowerCase()) {
      return { originalLanguageName, translation: text };
    }

    // Check if translation exists
    const existing = await this.translationRepo.findOne({
      where: {
        input_text: text,
        input_language_id: originalLanguage.id,
        output_language_id: outputLanguageId,
      },
      select: { output_text: true, id: true },
    });

    if (existing) {
      const translation = existing.output_text;

      if (!isShortInputText) {
        return { originalLanguageName, translation };
      }

      const [inputSyn, outputSyn, example] = await Promise.all([
        this.synonymRepo.findOne({ where: { text, language_id: originalLanguage.id }, select: { synonym_arr: true } }),
        this.synonymRepo.findOne({ where: { text: translation, language_id: outputLanguageId }, select: { synonym_arr: true } }),
        this.exampleSentenceRepo.findOne({
          where: { text, language_id: originalLanguage.id, output_language_id: outputLanguageId },
          select: { example_sentence_translation_id_arr: true },
        }),
      ]);

      if (inputSyn && outputSyn && example) {
        const exampleTranslations = await this.translationRepo.find({
          where: example.example_sentence_translation_id_arr.map((id) => ({ id })),
          select: { input_text: true, output_text: true },
        });

        const exampleSentenceArr = exampleTranslations.map(({ input_text: sentence, output_text: translation }) => ({
          sentence,
          translation,
        }));

        return {
          originalLanguageName,
          inputTextSynonymArr: inputSyn.synonym_arr,
          translation,
          translationSynonymArr: outputSyn.synonym_arr,
          exampleSentenceArr,
        };
      }
    }

    // Generate via LLM
    const [translatedTextAndSynonyms, inputTextSynonymArr, exampleSentenceArr] = await Promise.all([
      this.llmService.translateTextAndGenerateSynonyms(text, isShortInputText, originalLanguageName, outputLanguage.name),
      isShortInputText ? this.llmService.generateSynonyms(text, originalLanguageName) : Promise.resolve([]),
      isShortInputText ? this.llmService.generateExampleSentences(text, originalLanguageName, outputLanguage.name) : Promise.resolve([]),
    ]);

    if (!translatedTextAndSynonyms || !inputTextSynonymArr || !exampleSentenceArr) {
      throw new Error('Failed to translate text and generate synonyms');
    }

    const { translation, synonyms: translationSynonymArr } = translatedTextAndSynonyms;

    // isShortInputText && inputTextSynonym, translationSynonym, and exampleSentence exist -> Store output to database
    (async () => {
      try {
        if (isShortInputText && inputTextSynonymArr.length && translationSynonymArr.length && exampleSentenceArr.length) {
          const exampleIds: number[] = [];
          for (const { sentence, translation: t } of exampleSentenceArr) {
            const rec = await this.translationRepo.save(
              this.translationRepo.create({
                input_text: sentence,
                input_language_id: originalLanguage.id,
                output_text: t,
                output_language_id: outputLanguageId,
              }),
            );
            exampleIds.push(rec.id);
          }

          await this.translationRepo.save(
            this.translationRepo.create({
              input_text: text,
              input_language_id: originalLanguage.id,
              output_text: translation,
              output_language_id: outputLanguageId,
            }),
          );

          await this.synonymRepo.save(
            this.synonymRepo.create({ text, synonym_arr: inputTextSynonymArr, language_id: originalLanguage.id }),
          );
          await this.synonymRepo.save(
            this.synonymRepo.create({ text: translation, synonym_arr: translationSynonymArr, language_id: outputLanguageId }),
          );

          await this.exampleSentenceRepo.save(
            this.exampleSentenceRepo.create({
              text,
              example_sentence_translation_id_arr: exampleIds,
              language_id: originalLanguage.id,
              output_language_id: outputLanguageId,
            }),
          );
        }
      } catch (error) {
        logError('storeOutput', error);
      }
    })();

    return { originalLanguageName, inputTextSynonymArr, translation, translationSynonymArr, exampleSentenceArr };
  }
}
