import type { Request } from 'express';
import { Body, Controller, Patch, Post, Req, UseGuards } from '@nestjs/common';

import { AuthGuard } from '@/modules/auth/auth.guard';
import { extractAuthenticatedUserId, extractSignInUserAuthContext } from '@/controllers/user/adapters/request-auth-context.adapter';
import { SignInUserResponseDto } from '@/controllers/user/dto/sign-in-user-response.dto';
import { UpdateUserDto } from '@/controllers/user/dto/update-user.dto';
import { UpdateUserResponseDto } from '@/controllers/user/dto/update-user-response.dto';
import { mapSignInUserResponse, mapUpdateUserResponse } from '@/controllers/user/mappers/user-response.mapper';
import { SignInUserUseCase } from '@/use-cases/user/sign-in-user.use-case';
import { UpdateUserUseCase } from '@/use-cases/user/update-user.use-case';

@Controller('user')
export class UserController {
  constructor(
    private readonly signInUserUseCase: SignInUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  @Patch()
  @UseGuards(AuthGuard)
  async updateUser(@Req() req: Request, @Body() body: UpdateUserDto): Promise<UpdateUserResponseDto> {
    const userId = extractAuthenticatedUserId(req.user);

    await this.updateUserUseCase.execute({ userId, lastUsedLanguageId: body.lastUsedLanguageId });

    return mapUpdateUserResponse();
  }

  @Post('sign-in')
  @UseGuards(AuthGuard)
  async signInUser(@Req() req: Request): Promise<SignInUserResponseDto> {
    const authContext = extractSignInUserAuthContext(req.user);
    const result = await this.signInUserUseCase.execute({
      userId: authContext.userId,
      email: authContext.email,
      name: authContext.name,
      pictureUrl: authContext.pictureUrl,
    });

    return mapSignInUserResponse({
      userId: authContext.userId,
      email: authContext.email,
      name: authContext.name,
      pictureUrl: result.pictureUrl,
      lastUsedLanguageId: result.lastUsedLanguageId,
    });
  }
}
