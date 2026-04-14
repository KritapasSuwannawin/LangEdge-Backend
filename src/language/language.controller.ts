import { Controller, Get, Query } from '@nestjs/common';

import { GetLanguageDto } from '@/language/dto/get-language.dto';
import { GetLanguageResponseDto } from '@/language/dto/get-language-response.dto';
import { mapGetLanguageResponse } from '@/language/mappers/language-response.mapper';
import { LanguageService } from '@/language/language.service';

@Controller('language')
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Get()
  async getLanguage(@Query() query: GetLanguageDto): Promise<GetLanguageResponseDto> {
    const languageArr = await this.languageService.getLanguage(query.id);

    return mapGetLanguageResponse(languageArr);
  }
}
