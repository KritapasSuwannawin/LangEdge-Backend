import { IsString, IsNotEmpty, MaxLength, IsInt, Min } from 'class-validator';

export class GetTranslationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(400)
  text: string;

  @IsInt()
  @Min(1)
  outputLanguageId: number;
}
