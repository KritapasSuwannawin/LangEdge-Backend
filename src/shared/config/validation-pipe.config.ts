import { ValidationPipeOptions } from '@nestjs/common';

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  whitelist: true,
  forbidNonWhitelisted: true,
  stopAtFirstError: true,
  validationError: { target: false, value: false },
};
