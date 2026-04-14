import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

import { validationPipeConfig } from '../src/infrastructure/config/validation-pipe.config';
import { GlobalExceptionFilter } from '../src/infrastructure/http/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/infrastructure/http/interceptors/response-envelope.interceptor';

export const applyHttpContractGlobals = (app: INestApplication): void => {
  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
};
