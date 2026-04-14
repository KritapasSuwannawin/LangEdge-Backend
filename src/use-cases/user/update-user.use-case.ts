import { Inject, Injectable } from '@nestjs/common';

import { NotFoundAppError } from '@/domain/shared/errors/not-found-app-error';
import type { IUserRepository } from '@/repositories/user/i-user.repository';
import type { UpdateUserInput } from './update-user.types';

@Injectable()
export class UpdateUserUseCase {
  constructor(@Inject('IUserRepository') private readonly userRepository: IUserRepository) {}

  async execute(input: UpdateUserInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);

    if (!user) {
      throw new NotFoundAppError({
        code: 'USER_NOT_FOUND',
        publicMessage: 'User not found',
      });
    }

    await this.userRepository.updateLastUsedLanguageId(input.userId, input.lastUsedLanguageId);
  }
}
