import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../infrastructure/services/firebase.service';
import { extractBearerToken } from '../shared/utils/authUtils';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly firebaseService: FirebaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const bearerToken = extractBearerToken(req);

    if (!bearerToken) {
      throw new UnauthorizedException();
    }

    const decodedData = await this.firebaseService.verifyAccessToken(bearerToken);

    if (!decodedData) {
      throw new UnauthorizedException();
    }

    // Attach user to request
    req.user = decodedData;
    return true;
  }
}
