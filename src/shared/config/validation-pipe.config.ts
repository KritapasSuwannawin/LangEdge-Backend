import { ValidationPipeOptions } from '@nestjs/common';
import { ValidationError } from 'class-validator';

import { AppErrorDetail } from '@/shared/domain/errors/app-error-detail';
import { ValidationAppError } from '@/shared/domain/errors/validation-app-error';

const VALIDATION_FALLBACK_MESSAGE = 'Validation failed';

const createValidationDetail = (field: string | undefined, message: string): AppErrorDetail => {
  if (!field) {
    return { message };
  }

  return { field, message };
};

const buildFieldPath = (parentPath: string | undefined, property: string): string | undefined => {
  if (!parentPath && !property) {
    return undefined;
  }

  if (!parentPath) {
    return property;
  }

  if (!property) {
    return parentPath;
  }

  return `${parentPath}.${property}`;
};

const flattenValidationError = (validationError: ValidationError, parentPath?: string): AppErrorDetail[] => {
  const field = buildFieldPath(parentPath, validationError.property);
  const constraintDetails = Object.values(validationError.constraints ?? {}).map((message) => createValidationDetail(field, message));
  const childDetails = (validationError.children ?? []).flatMap((childValidationError) =>
    flattenValidationError(childValidationError, field),
  );

  return [...constraintDetails, ...childDetails];
};

/** Converts class-validator output into stable field-level error details. */
export const buildValidationErrorDetails = (validationErrors: ReadonlyArray<ValidationError>): AppErrorDetail[] => {
  const details = validationErrors.flatMap((validationError) => flattenValidationError(validationError));

  if (details.length > 0) {
    return details;
  }

  return [createValidationDetail(undefined, VALIDATION_FALLBACK_MESSAGE)];
};

/** Creates the shared validation error emitted by the global Nest validation pipe. */
export const validationExceptionFactory = (validationErrors: ValidationError[]): ValidationAppError => {
  const details = buildValidationErrorDetails(validationErrors);

  return new ValidationAppError({ details });
};

export const validationPipeConfig: ValidationPipeOptions = {
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  whitelist: true,
  forbidNonWhitelisted: true,
  stopAtFirstError: true,
  validationError: { target: false, value: false },
  exceptionFactory: validationExceptionFactory,
};
