import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../infrastructure/database/entities/language.entity';

@Injectable()
export class LanguageService {
  constructor(@InjectRepository(Language) private readonly languageRepo: Repository<Language>) {}

  async getLanguage(id?: number) {
    if (id) {
      return await this.languageRepo.find({ where: { id } });
    }

    return this.languageRepo.find();
  }
}
