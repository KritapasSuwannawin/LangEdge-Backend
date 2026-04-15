import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { extractAuthenticatedUserId, extractSignInUserAuthContext } from '@/controllers/user/adapters/request-auth-context.adapter';

describe('extractAuthenticatedUserId', () => {
  it('should return user_id when present', () => {
    expect(extractAuthenticatedUserId({ user_id: 'uid-123' })).toBe('uid-123');
  });

  it('should fall back to uid when user_id is absent', () => {
    expect(extractAuthenticatedUserId({ uid: 'uid-456' })).toBe('uid-456');
  });

  it('should fall back to uid when user_id is an empty string', () => {
    expect(extractAuthenticatedUserId({ user_id: '', uid: 'uid-789' })).toBe('uid-789');
  });

  it('should fall back to uid when user_id is whitespace only', () => {
    expect(extractAuthenticatedUserId({ user_id: '   ', uid: 'uid-trim' })).toBe('uid-trim');
  });

  it('should throw ValidationAppError when both user_id and uid are absent', () => {
    expect(() => extractAuthenticatedUserId({})).toThrow(ValidationAppError);
    expect(() => extractAuthenticatedUserId({})).toThrow(expect.objectContaining({ publicMessage: 'Authenticated user id is required' }));
  });

  it('should throw ValidationAppError when requestUser is null', () => {
    expect(() => extractAuthenticatedUserId(null)).toThrow(ValidationAppError);
    expect(() => extractAuthenticatedUserId(null)).toThrow(
      expect.objectContaining({ publicMessage: 'Authenticated user context is required' }),
    );
  });

  it('should throw ValidationAppError when requestUser is a string', () => {
    expect(() => extractAuthenticatedUserId('not-an-object')).toThrow(ValidationAppError);
  });
});

describe('extractSignInUserAuthContext', () => {
  it('should return full context when all fields are present', () => {
    const result = extractSignInUserAuthContext({
      user_id: 'u1',
      email: 'a@b.com',
      name: 'Alice',
      picture: 'http://pic.url',
    });

    expect(result).toEqual({ userId: 'u1', email: 'a@b.com', name: 'Alice', pictureUrl: 'http://pic.url' });
  });

  it('should fall back to uid when user_id is absent', () => {
    const result = extractSignInUserAuthContext({ uid: 'u2', email: 'a@b.com', name: 'Alice' });

    expect(result.userId).toBe('u2');
  });

  it('should set pictureUrl to undefined when picture is absent', () => {
    const result = extractSignInUserAuthContext({ user_id: 'u3', email: 'a@b.com', name: 'Alice' });

    expect(result.pictureUrl).toBeUndefined();
  });

  it('should set pictureUrl to undefined when picture is an empty string', () => {
    const result = extractSignInUserAuthContext({ user_id: 'u3', email: 'a@b.com', name: 'Alice', picture: '' });

    expect(result.pictureUrl).toBeUndefined();
  });

  it('should throw ValidationAppError when email is missing', () => {
    expect(() => extractSignInUserAuthContext({ user_id: 'u4', name: 'Alice' })).toThrow(
      expect.objectContaining({ publicMessage: 'Email is required' }),
    );
  });

  it('should throw ValidationAppError when email is an empty string', () => {
    expect(() => extractSignInUserAuthContext({ user_id: 'u4', email: '', name: 'Alice' })).toThrow(
      expect.objectContaining({ publicMessage: 'Email is required' }),
    );
  });

  it('should throw ValidationAppError when name is missing', () => {
    expect(() => extractSignInUserAuthContext({ user_id: 'u5', email: 'a@b.com' })).toThrow(
      expect.objectContaining({ publicMessage: 'Name is required' }),
    );
  });

  it('should throw ValidationAppError when requestUser is not an object', () => {
    expect(() => extractSignInUserAuthContext('not-an-object')).toThrow(ValidationAppError);
    expect(() => extractSignInUserAuthContext('not-an-object')).toThrow(
      expect.objectContaining({ publicMessage: 'Authenticated user context is required' }),
    );
  });
});
