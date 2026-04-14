import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';

export interface SignInUserAuthContext {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl: string | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const createMissingAuthContextError = (field: string, message: string): ValidationAppError => {
  return new ValidationAppError({
    publicMessage: message,
    details: [{ field, message }],
  });
};

const resolveUserId = (requestUser: Record<string, unknown>): string => {
  const tokenUserId = requestUser['user_id'];
  const uid = requestUser['uid'];

  if (isNonEmptyString(tokenUserId)) {
    return tokenUserId;
  }

  if (isNonEmptyString(uid)) {
    return uid;
  }

  throw createMissingAuthContextError('userId', 'Authenticated user id is required');
};

export const extractAuthenticatedUserId = (requestUser: unknown): string => {
  if (!isRecord(requestUser)) {
    throw createMissingAuthContextError('user', 'Authenticated user context is required');
  }

  return resolveUserId(requestUser);
};

export const extractSignInUserAuthContext = (requestUser: unknown): SignInUserAuthContext => {
  if (!isRecord(requestUser)) {
    throw createMissingAuthContextError('user', 'Authenticated user context is required');
  }

  const userId = resolveUserId(requestUser);

  const emailValue = requestUser['email'];
  if (!isNonEmptyString(emailValue)) {
    throw createMissingAuthContextError('email', 'Email is required');
  }

  const nameValue = requestUser['name'];
  if (!isNonEmptyString(nameValue)) {
    throw createMissingAuthContextError('name', 'Name is required');
  }

  const pictureValue = requestUser['picture'];
  const pictureUrl = isNonEmptyString(pictureValue) ? pictureValue : undefined;

  return { userId, email: emailValue, name: nameValue, pictureUrl };
};
