import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { downloadFile } from '../shared/utils/httpUtils';

import { User } from '../infrastructure/database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async updateUser(userId: string, body: UpdateUserDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.last_used_language_id = body.lastUsedLanguageId;
    await this.userRepo.save(user);
  }

  async signInUser(userId: string, email: string, name: string, pictureUrl?: string) {
    let lastUsedLanguageId: number | undefined;
    const existingUser = await this.userRepo.findOne({ where: { id: userId } });

    if (!existingUser) {
      const saved = await this.userRepo.save(this.userRepo.create({ id: userId, email, name, picture_url: pictureUrl || null }));

      if (saved.last_used_language_id) {
        lastUsedLanguageId = saved.last_used_language_id;
      }
    } else {
      existingUser.email = email;
      existingUser.name = name;

      if (pictureUrl) {
        existingUser.picture_url = pictureUrl;
      }

      const saved = await this.userRepo.save(existingUser);

      if (saved.last_used_language_id) {
        lastUsedLanguageId = saved.last_used_language_id;
      }
    }

    return { pictureUrl: pictureUrl ? await downloadFile(pictureUrl) : undefined, lastUsedLanguageId };
  }
}
