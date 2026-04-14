import { ValidationError } from 'class-validator';

import { ValidationAppError } from '@/shared/domain/errors/validation-app-error';

import { buildValidationErrorDetails, validationExceptionFactory, validationPipeConfig } from './validation-pipe.config';

const createValidationError = ({
  property,
  constraints,
  children = [],
}: {
  property: string;
  constraints?: Record<string, string>;
  children?: ValidationError[];
}): ValidationError => {
  return {
    property,
    constraints,
    children,
  };
};

describe('validationPipeConfig', () => {
  describe('buildValidationErrorDetails', () => {
    it('should flatten nested validation errors into field-level details', () => {
      const validationErrors = [
        createValidationError({
          property: 'profile',
          children: [
            createValidationError({
              property: 'displayName',
              constraints: {
                isString: 'displayName must be a string',
              },
            }),
          ],
        }),
        createValidationError({
          property: 'email',
          constraints: {
            isEmail: 'email must be an email',
          },
        }),
      ];

      expect(buildValidationErrorDetails(validationErrors)).toEqual([
        { field: 'profile.displayName', message: 'displayName must be a string' },
        { field: 'email', message: 'email must be an email' },
      ]);
    });

    it('should fall back to a generic validation message when no constraints are present', () => {
      const validationErrors = [createValidationError({ property: '' })];

      expect(buildValidationErrorDetails(validationErrors)).toEqual([{ message: 'Validation failed' }]);
    });
  });

  describe('validationExceptionFactory', () => {
    it('should return a ValidationAppError through the configured exceptionFactory', () => {
      const exceptionFactory = validationPipeConfig.exceptionFactory;
      const validationErrors = [
        createValidationError({
          property: 'outputLanguageId',
          constraints: {
            isInt: 'outputLanguageId must be an integer number',
          },
        }),
      ];

      expect(exceptionFactory).toBeDefined();

      if (!exceptionFactory) {
        throw new Error('Validation exception factory is not configured');
      }

      const exception = exceptionFactory(validationErrors);

      expect(exception).toBeInstanceOf(ValidationAppError);

      if (!(exception instanceof ValidationAppError)) {
        throw new Error('Expected ValidationAppError');
      }

      expect(exception.statusCode).toBe(400);
      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.publicMessage).toBe('outputLanguageId must be an integer number');
      expect(exception.details).toEqual([{ field: 'outputLanguageId', message: 'outputLanguageId must be an integer number' }]);
    });

    it('should create the same shared error when invoked directly', () => {
      const validationErrors = [
        createValidationError({
          property: 'text',
          constraints: {
            isNotEmpty: 'text should not be empty',
          },
        }),
      ];

      const exception = validationExceptionFactory(validationErrors);

      expect(exception).toBeInstanceOf(ValidationAppError);
      expect(exception.publicMessage).toBe('text should not be empty');
      expect(exception.details).toEqual([{ field: 'text', message: 'text should not be empty' }]);
    });
  });
});
