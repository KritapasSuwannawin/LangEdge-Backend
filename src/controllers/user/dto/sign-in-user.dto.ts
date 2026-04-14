import { IsString, IsNotEmpty, IsEmail, IsOptional, IsInt, Min } from 'class-validator';

export class SignInUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  pictureUrl?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  lastUsedLanguageId?: number;
}
