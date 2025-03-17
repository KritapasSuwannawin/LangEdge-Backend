import zod from 'zod';

export const refreshTokenSchema = zod.object({
  refreshToken: zod.string(),
});
