import { GetLanguageResponseDto, LanguageResponseDto } from '@/language/dto/get-language-response.dto';

interface LanguageResponseSource {
  readonly id: number;
  readonly name: string;
  readonly code: string;
}

const mapLanguageResponse = (source: LanguageResponseSource): LanguageResponseDto => {
  return {
    id: source.id,
    name: source.name,
    code: source.code,
  };
};

export const mapGetLanguageResponse = (languageArr: ReadonlyArray<LanguageResponseSource>): GetLanguageResponseDto => {
  return {
    languageArr: languageArr.map(mapLanguageResponse),
  };
};
