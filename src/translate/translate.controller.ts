import { Controller, Get, Query, InternalServerErrorException, UseGuards, HttpException } from '@nestjs/common';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';

import { logError } from '../shared/utils/systemUtils';
import { AuthGuard } from '../auth/auth.guard';

import { GetTranslationDto } from './dto/get-translation.dto';
import { TranslateService } from './translate.service';

@Controller('translation')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Get()
  @UseGuards(ThrottlerGuard, AuthGuard)
  @Throttle({ translate: { ttl: 60000, limit: 10 } })
  async getTranslation(@Query() query: GetTranslationDto) {
    try {
      const { originalLanguageName, inputTextSynonymArr, translation, translationSynonymArr, exampleSentenceArr } =
        await this.translateService.getTranslation(query);
      return { data: { originalLanguageName, inputTextSynonymArr, translation, translationSynonymArr, exampleSentenceArr } };
    } catch (error) {
      logError('getTranslation', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
