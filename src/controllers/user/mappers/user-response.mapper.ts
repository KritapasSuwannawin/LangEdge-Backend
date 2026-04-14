import { SignInUserResponseDto } from '@/controllers/user/dto/sign-in-user-response.dto';
import { UpdateUserResponseDto } from '@/controllers/user/dto/update-user-response.dto';

interface SignInUserResponseSource {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly pictureUrl?: string;
  readonly lastUsedLanguageId?: number;
}

export const mapSignInUserResponse = (source: SignInUserResponseSource): SignInUserResponseDto => {
  return {
    userId: source.userId,
    email: source.email,
    name: source.name,
    pictureUrl: source.pictureUrl,
    lastUsedLanguageId: source.lastUsedLanguageId,
  };
};

export const mapUpdateUserResponse = (): UpdateUserResponseDto => {
  return { message: 'Success' };
};
