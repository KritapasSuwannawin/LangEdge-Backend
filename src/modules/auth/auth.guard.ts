import type { Request } from 'express';
import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import type { IAuthPort } from '@/domain/shared/ports/i-auth.port';
import { extractBearerToken } from '@/shared/utils/authUtils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject('IAuthPort') private readonly authPort: IAuthPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const bearerToken = extractBearerToken(req);

    if (!bearerToken) {
      throw new UnauthorizedException();
    }

    const decodedData = await this.authPort.verifyToken(bearerToken);

    if (!decodedData) {
      throw new UnauthorizedException();
    }

    // Attach user to request
    req.user = decodedData;
    return true;
  }
}
