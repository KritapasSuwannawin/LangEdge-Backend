import { Inject, Injectable } from '@nestjs/common';

import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';
import type { RefreshTokenInput, RefreshTokenResult } from '@/use-cases/auth/refresh-token.types';

@Injectable()
export class RefreshTokenUseCase {
  constructor(@Inject('IAuthPort') private readonly authPort: IAuthPort) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    return this.authPort.refreshToken(input.refreshToken);
  }
}
