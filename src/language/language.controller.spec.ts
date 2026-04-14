import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { GetLanguageDto } from '@/controllers/language/dto/get-language.dto';

describe('LanguageController', () => {
  let controller: LanguageController;
  let mockService: jest.Mocked<Pick<LanguageService, 'getLanguage'>>;

  beforeEach(() => {
    mockService = {
      getLanguage: jest.fn(),
    };
    controller = new LanguageController(mockService as unknown as LanguageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLanguage', () => {
    it('should return all languages as a plain payload when no id is provided', async () => {
      const mockLanguages = [
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
        { id: 3, name: 'French', code: 'fr' },
      ];
      mockService.getLanguage.mockResolvedValue(mockLanguages);

      const query: GetLanguageDto = {};
      const result = await controller.getLanguage(query);

      expect(mockService.getLanguage).toHaveBeenCalledWith(undefined);
      expect(mockService.getLanguage).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ languageArr: mockLanguages });
    });

    it('should return specific language when id is provided', async () => {
      const mockLanguage = [{ id: 1, name: 'English', code: 'en' }];
      mockService.getLanguage.mockResolvedValue(mockLanguage);

      const query: GetLanguageDto = { id: 1 };
      const result = await controller.getLanguage(query);

      expect(mockService.getLanguage).toHaveBeenCalledWith(1);
      expect(result).toEqual({ languageArr: mockLanguage });
    });

    it('should return empty array when no languages found', async () => {
      mockService.getLanguage.mockResolvedValue([]);

      const query: GetLanguageDto = { id: 999 };
      const result = await controller.getLanguage(query);

      expect(result).toEqual({ languageArr: [] });
    });

    it('should propagate service errors without controller translation', async () => {
      const serviceError = new Error('Database error');
      mockService.getLanguage.mockRejectedValue(serviceError);

      const query: GetLanguageDto = {};

      await expect(controller.getLanguage(query)).rejects.toBe(serviceError);
    });

    it('should handle numeric string id from query params', async () => {
      const mockLanguage = [{ id: 2, name: 'Spanish', code: 'es' }];
      mockService.getLanguage.mockResolvedValue(mockLanguage);

      // Query params often come as strings and are transformed by DTO
      const query: GetLanguageDto = { id: 2 };
      const result = await controller.getLanguage(query);

      expect(mockService.getLanguage).toHaveBeenCalledWith(2);
      expect(result).toEqual({ languageArr: mockLanguage });
    });

    it('should return multiple languages in correct order', async () => {
      const mockLanguages = [
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ];
      mockService.getLanguage.mockResolvedValue(mockLanguages);

      const result = await controller.getLanguage({});

      expect(result.languageArr).toHaveLength(2);
      expect(result.languageArr[0].id).toBe(1);
      expect(result.languageArr[1].id).toBe(2);
    });
  });
});
