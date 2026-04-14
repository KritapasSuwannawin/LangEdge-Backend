import type { Request } from 'express';
import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@/auth/auth.guard';
import { ValidationAppError } from '@/domain/shared/errors/validation-app-error';
import { SignInUserResponseDto } from '@/controllers/user/dto/sign-in-user-response.dto';
import { UpdateUserDto } from '@/controllers/user/dto/update-user.dto';
import { UpdateUserResponseDto } from '@/controllers/user/dto/update-user-response.dto';
import { mapSignInUserResponse, mapUpdateUserResponse } from '@/controllers/user/mappers/user-response.mapper';
import { UserService } from '@/user/user.service';

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

const getRequestUserRecord = (requestUser: unknown): Record<string, unknown> => {
  if (!isRecord(requestUser)) {
    throw createMissingAuthContextError('user', 'Authenticated user context is required');
  }

  return requestUser;
};

const getRequiredAuthContextValue = (requestUser: Record<string, unknown>, field: string, message: string): string => {
  const value = requestUser[field];

  if (!isNonEmptyString(value)) {
    throw createMissingAuthContextError(field, message);
  }

  return value;
};

const getUserIdFromAuthContext = (requestUser: Record<string, unknown>): string => {
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

const getOptionalAuthContextValue = (requestUser: Record<string, unknown>, field: string): string | undefined => {
  const value = requestUser[field];

  return isNonEmptyString(value) ? value : undefined;
};

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch()
  @UseGuards(AuthGuard)
  async updateUser(@Req() req: Request, @Body() body: UpdateUserDto): Promise<UpdateUserResponseDto> {
    const requestUser = getRequestUserRecord(req.user);
    const userId = getUserIdFromAuthContext(requestUser);

    await this.userService.updateUser(userId, body);

    return mapUpdateUserResponse();
  }

  @Post('sign-in')
  @UseGuards(AuthGuard)
  async signInUser(@Req() req: Request): Promise<SignInUserResponseDto> {
    const requestUser = getRequestUserRecord(req.user);
    const userId = getUserIdFromAuthContext(requestUser);
    const email = getRequiredAuthContextValue(requestUser, 'email', 'Email is required');
    const name = getRequiredAuthContextValue(requestUser, 'name', 'Name is required');
    const pictureUrl = getOptionalAuthContextValue(requestUser, 'picture');
    const signInUserResult = await this.userService.signInUser(userId, email, name, pictureUrl);

    return mapSignInUserResponse({
      userId,
      email,
      name,
      pictureUrl: signInUserResult.pictureUrl,
      lastUsedLanguageId: signInUserResult.lastUsedLanguageId,
    });
  }
}
