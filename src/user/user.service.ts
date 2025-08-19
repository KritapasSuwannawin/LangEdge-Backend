import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { downloadFile } from '../shared/utils/httpUtils';

import { User } from '../infrastructure/database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  async updateUser(userId: string, body: UpdateUserDto) {
    await this.userRepo.update({ id: userId }, { last_used_language_id: body.lastUsedLanguageId });
    return { message: 'User updated' };
  }

  async signInUser(userId: string, email: string, name: string, pictureUrl?: string) {
    let lastUsedLanguageId: number | undefined;

    try {
      await this.userRepo.insert({ id: userId, email, name, picture_url: pictureUrl || null } as User);
    } catch (err) {
      // Constraint violation -> update existing instead
      const updatePayload: Partial<User> = { email, name };

      if (pictureUrl) {
        updatePayload.picture_url = pictureUrl;
      }

      await this.userRepo.update({ id: userId }, updatePayload);

      const updated = await this.userRepo.findOne({ where: { id: userId }, select: { last_used_language_id: true } });
      if (updated && updated.last_used_language_id) {
        lastUsedLanguageId = updated.last_used_language_id;
      }
    }

    return {
      data: {
        userId,
        email,
        name,
        pictureUrl: pictureUrl ? await downloadFile(pictureUrl) : undefined,
        lastUsedLanguageId,
      },
    };
  }
}
