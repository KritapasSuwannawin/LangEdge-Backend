import { Controller, Get, Query, InternalServerErrorException } from '@nestjs/common';
import { GetLanguageDto } from './dto/get-language.dto';
import { LanguageService } from './language.service';
import { logError } from '../shared/utils/systemUtils';

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  async getLanguage(@Query() query: GetLanguageDto) {
    try {
      const languageArr = await this.languageService.getLanguage(query.id);
      return { data: { languageArr } };
    } catch (error) {
      logError('getLanguage', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
