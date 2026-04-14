import { IsInt, Min } from 'class-validator';

export class UpdateUserDto {
  @IsInt()
  @Min(1)
  lastUsedLanguageId: number;
}
