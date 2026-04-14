import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { DecodedIdToken } from 'firebase-admin/auth';
import morgan from 'morgan';

import { logInfo } from '@/shared/utils/systemUtils';
import { validationPipeConfig } from '@/shared/config/validation-pipe.config';
import { GlobalExceptionFilter } from '@/shared/infrastructure/http/filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from '@/shared/infrastructure/http/interceptors/response-envelope.interceptor';

import { AppModule } from './app.module';

import packageJson from '../package.json';

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user: DecodedIdToken;
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for API routes
  app.setGlobalPrefix('api');

  // Enable CORS with credentials
  app.enableCors({
    credentials: true,
  });

  // Global validation for DTOs
  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));
  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());

  // Use morgan for request logging
  app.use(
    morgan('tiny', {
      skip: (_req, res) => res.statusCode === 404,
      stream: {
        write: (message) => {
          logInfo('http.request', decodeURIComponent(message.trim()));
        },
      },
    }),
  );

  const port = Number(process.env.PORT ?? 8000);

  await app.listen(port);
  logInfo('bootstrap.startup', `${packageJson.name} running on port ${port}`);
}
bootstrap();
