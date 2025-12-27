import { DecodedIdToken } from 'firebase-admin/auth';
import morgan from 'morgan';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import packageJson from '../package.json';
import { AppModule } from './app.module';

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
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      validationError: { target: false, value: false },
    }),
  );

  // Use morgan for request logging
  app.use(
    morgan('tiny', {
      skip: (_req, res) => res.statusCode === 404,
      stream: {
        write: (message) => {
          console.log(decodeURIComponent(message.trim()));
        },
      },
    }),
  );

  const port = Number(process.env.PORT ?? 8000);

  await app.listen(port);
  console.log(`${packageJson.name} running on port ${port}...`);
}
bootstrap();
