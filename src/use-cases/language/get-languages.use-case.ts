import { Inject, Injectable } from '@nestjs/common';

import type { LanguageRecord } from '@/domain/language/language.record';
import type { ILanguageRepository } from '@/repositories/language/i-language.repository';

export interface GetLanguagesInput {
  readonly id?: number;
}

@Injectable()
export class GetLanguagesUseCase {
  constructor(@Inject('ILanguageRepository') private readonly languageRepository: ILanguageRepository) {}

  async execute(input: GetLanguagesInput): Promise<LanguageRecord[]> {
    if (input.id === undefined) {
      return this.languageRepository.findAll();
    }

    const language = await this.languageRepository.findById(input.id);

    return language ? [language] : [];
  }
}
