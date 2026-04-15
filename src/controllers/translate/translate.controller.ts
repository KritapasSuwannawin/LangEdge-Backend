import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

import { GetTranslationDto } from '@/controllers/translate/dto/get-translation.dto';
import { GetTranslationResponseDto } from '@/controllers/translate/dto/get-translation-response.dto';
import { mapGetTranslationResponse } from '@/controllers/translate/mappers/translate-response.mapper';
import { AuthGuard } from '@/modules/auth/auth.guard';
import { GetTranslationUseCase } from '@/use-cases/translate/get-translation.use-case';

@Controller('translation')
export class TranslateController {
  constructor(private readonly getTranslationUseCase: GetTranslationUseCase) {}

  @Get()
  @UseGuards(ThrottlerGuard, AuthGuard)
  @Throttle({ translate: { ttl: 60000, limit: 10 } })
  async getTranslation(@Query() query: GetTranslationDto): Promise<GetTranslationResponseDto> {
    const translationResult = await this.getTranslationUseCase.execute({
      text: query.text,
      outputLanguageId: query.outputLanguageId,
    });

    return mapGetTranslationResponse(translationResult);
  }
}
