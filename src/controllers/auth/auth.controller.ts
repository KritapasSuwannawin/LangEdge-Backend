import { Body, Controller, Post } from '@nestjs/common';

import { RefreshTokenDto } from '@/controllers/auth/dto/refresh-token.dto';
import { RefreshTokenResponseDto } from '@/controllers/auth/dto/refresh-token-response.dto';
import { mapRefreshTokenResponse } from '@/controllers/auth/mappers/auth-response.mapper';
import { RefreshTokenUseCase } from '@/use-cases/auth/refresh-token.use-case';

@Controller('auth')
export class AuthController {
  constructor(private readonly refreshTokenUseCase: RefreshTokenUseCase) {}

  @Post('token/refresh')
  async refreshToken(@Body() body: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const tokenResponse = await this.refreshTokenUseCase.execute({ refreshToken: body.refreshToken });

    return mapRefreshTokenResponse(tokenResponse);
  }
}
