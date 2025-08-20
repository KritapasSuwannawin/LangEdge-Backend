import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from '../infrastructure/database/entities/language.entity';

@Injectable()
export class LanguageService {
  constructor(@InjectRepository(Language) private readonly languageRepo: Repository<Language>) {}

  async getLanguage(id?: number): Promise<Pick<Language, 'id' | 'name' | 'code'>[]> {
    if (id) {
      const found = await this.languageRepo.find({ where: { id }, select: { id: true, name: true, code: true } });
      return found;
    }

    return this.languageRepo.find({ select: { id: true, name: true, code: true } });
  }
}
