import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

import { AuthGuard } from '@/auth/auth.guard';
import { GetTranslationDto } from '@/controllers/translate/dto/get-translation.dto';
import { GetTranslationResponseDto } from '@/controllers/translate/dto/get-translation-response.dto';
import { mapGetTranslationResponse } from '@/controllers/translate/mappers/translate-response.mapper';
import { TranslateService } from '@/translate/translate.service';

@Controller('translation')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Get()
  @UseGuards(ThrottlerGuard, AuthGuard)
  @Throttle({ translate: { ttl: 60000, limit: 10 } })
  async getTranslation(@Query() query: GetTranslationDto): Promise<GetTranslationResponseDto> {
    const translationResult = await this.translateService.getTranslation(query);

    return mapGetTranslationResponse(translationResult);
  }
}
