import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from '@/auth/auth.service';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import { RefreshTokenResponseDto } from '@/auth/dto/refresh-token-response.dto';
import { mapRefreshTokenResponse } from '@/auth/mappers/auth-response.mapper';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/refresh')
  async refreshToken(@Body() body: RefreshTokenDto): Promise<RefreshTokenResponseDto> {
    const tokenResponse = await this.authService.refreshToken(body.refreshToken);

    return mapRefreshTokenResponse(tokenResponse);
  }
}
