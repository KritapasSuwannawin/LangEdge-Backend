import { Transform } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

export class GetLanguageDto {
  @IsOptional()
  @Transform(({ value }) => {
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  @IsInt()
  @Min(1)
  id?: number;
}
