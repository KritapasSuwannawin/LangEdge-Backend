import { IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetTranslationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  text: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  outputLanguageId: number;
}
