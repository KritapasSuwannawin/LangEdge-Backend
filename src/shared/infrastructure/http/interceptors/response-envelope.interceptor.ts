import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, map } from 'rxjs';

import { ApiSuccessEnvelope } from '@/shared/infrastructure/http/contracts/api-success-envelope';

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ApiSuccessEnvelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccessEnvelope<T>> {
    return next.handle().pipe(map((data) => ({ data })));
  }
}
