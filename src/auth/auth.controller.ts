import { Controller, Post, Body, InternalServerErrorException } from '@nestjs/common';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthService } from './auth.service';
import { logError } from '../shared/utils/systemUtils';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('token/refresh')
  async refreshToken(@Body() body: RefreshTokenDto) {
    try {
      const { idToken, refreshToken } = await this.authService.refreshToken(body.refreshToken);
      return { data: { accessToken: idToken, refreshToken } };
    } catch (error) {
      logError('refreshToken', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
