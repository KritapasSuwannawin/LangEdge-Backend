import { Controller, Get, Query, InternalServerErrorException, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

import { logError } from '../shared/utils/systemUtils';
import { AuthGuard } from '../auth/auth.guard';

import { GetTranslationDto } from './dto/get-translation.dto';
import { TranslateService } from './translate.service';

@Controller('translation')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Get()
  @UseGuards(ThrottlerGuard, AuthGuard)
  async getTranslation(@Query() query: GetTranslationDto) {
    try {
      return await this.translateService.getTranslation(query);
    } catch (error) {
      logError('getTranslation', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
