import { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';

import { ResponseEnvelopeInterceptor } from '@/infrastructure/http/interceptors/response-envelope.interceptor';

describe('ResponseEnvelopeInterceptor', () => {
  const interceptor = new ResponseEnvelopeInterceptor();
  const context = {} as ExecutionContext;

  const createCallHandler = <T>(payload: T): CallHandler<T> => ({
    handle: () => of(payload),
  });

  it('should wrap object payloads in a data envelope', async () => {
    const payload = {
      translation: 'Hola',
      originalLanguageName: 'English',
    };

    const result = await lastValueFrom(interceptor.intercept(context, createCallHandler(payload)));

    expect(result).toEqual({ data: payload });
  });

  it('should wrap array payloads in a data envelope', async () => {
    const payload = [
      { id: 1, name: 'English' },
      { id: 2, name: 'Spanish' },
    ];

    const result = await lastValueFrom(interceptor.intercept(context, createCallHandler(payload)));

    expect(result).toEqual({ data: payload });
  });
});
