import { Controller, Get, Query } from '@nestjs/common';

import { GetLanguageDto } from '@/controllers/language/dto/get-language.dto';
import { GetLanguageResponseDto } from '@/controllers/language/dto/get-language-response.dto';
import { mapGetLanguageResponse } from '@/controllers/language/mappers/language-response.mapper';
import { GetLanguagesUseCase } from '@/use-cases/language/get-languages.use-case';

@Controller('language')
export class LanguageController {
  constructor(private readonly getLanguagesUseCase: GetLanguagesUseCase) {}

  @Get()
  async getLanguage(@Query() query: GetLanguageDto): Promise<GetLanguageResponseDto> {
    const languageArr = await this.getLanguagesUseCase.execute({ id: query.id });

    return mapGetLanguageResponse(languageArr);
  }
}
