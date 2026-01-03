import type { Request } from 'express';
import {
  Controller,
  Patch,
  Post,
  Body,
  InternalServerErrorException,
  UseGuards,
  Req,
  BadRequestException,
  HttpException,
} from '@nestjs/common';

import { logError } from '../shared/utils/systemUtils';
import { AuthGuard } from '../auth/auth.guard';

import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch()
  @UseGuards(AuthGuard)
  async updateUser(@Req() req: Request, @Body() body: UpdateUserDto) {
    try {
      await this.userService.updateUser(req.user.user_id, body);
      return { message: 'Success' };
    } catch (error) {
      logError('updateUser', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }

  @Post('sign-in')
  @UseGuards(AuthGuard)
  async signInUser(@Req() req: Request) {
    try {
      const { user_id: userId, email, name, picture } = req.user;

      if (!email) {
        throw new BadRequestException('Email is required');
      }

      const { pictureUrl, lastUsedLanguageId } = await this.userService.signInUser(userId, email, name, picture);

      return { data: { userId, email, name, pictureUrl, lastUsedLanguageId } };
    } catch (error) {
      logError('signInUser', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException('Internal server error');
    }
  }
}
