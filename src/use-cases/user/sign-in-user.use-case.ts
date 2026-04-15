import { Inject, Injectable } from '@nestjs/common';

import type { IFileDownloadPort } from '@/domain/shared/ports/i-file-download.port';
import type { IUserRepository } from '@/repositories/user/i-user.repository';
import type { SignInUserInput, SignInUserResult } from '@/use-cases/user/sign-in-user.types';

@Injectable()
export class SignInUserUseCase {
  constructor(
    @Inject('IUserRepository') private readonly userRepository: IUserRepository,
    @Inject('IFileDownloadPort') private readonly fileDownloadPort: IFileDownloadPort,
  ) {}

  async execute(input: SignInUserInput): Promise<SignInUserResult> {
    const record = await this.userRepository.upsert({
      id: input.userId,
      email: input.email,
      name: input.name,
      pictureUrl: input.pictureUrl ?? null,
    });

    const downloadedPictureUrl = input.pictureUrl ? await this.fileDownloadPort.downloadAsBase64DataUrl(input.pictureUrl) : undefined;

    return {
      pictureUrl: downloadedPictureUrl,
      lastUsedLanguageId: record.lastUsedLanguageId ?? undefined,
    };
  }
}
