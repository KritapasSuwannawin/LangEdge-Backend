import type { Request } from 'express';
import { Controller, Patch, Post, Body, InternalServerErrorException, UseGuards, Req } from '@nestjs/common';

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
      return await this.userService.updateUser(req.user.user_id, body);
    } catch (error) {
      logError('updateUser', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }

  @Post('sign-in')
  @UseGuards(AuthGuard)
  async signInUser(@Req() req: Request) {
    try {
      const { user_id: userId, email, name, picture } = req.user;
      return await this.userService.signInUser(userId, email!, name, picture);
    } catch (error) {
      logError('signInUser', error);
      throw new InternalServerErrorException('Internal server error');
    }
  }
}
