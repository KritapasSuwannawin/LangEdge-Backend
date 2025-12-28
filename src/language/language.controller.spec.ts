import { InternalServerErrorException } from '@nestjs/common';

import { LanguageController } from './language.controller';
import { LanguageService } from './language.service';
import { GetLanguageDto } from './dto/get-language.dto';

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
    it('should return all languages wrapped in data object when no id is provided', async () => {
      const mockLanguages = [
        { id: 1, name: 'English' },
        { id: 2, name: 'Spanish' },
        { id: 3, name: 'French' },
      ];
      mockService.getLanguage.mockResolvedValue(mockLanguages as any);

      const query: GetLanguageDto = {};
      const result = await controller.getLanguage(query);

      expect(mockService.getLanguage).toHaveBeenCalledWith(undefined);
      expect(mockService.getLanguage).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: { languageArr: mockLanguages } });
    });

    it('should return specific language when id is provided', async () => {
      const mockLanguage = [{ id: 1, name: 'English' }];
      mockService.getLanguage.mockResolvedValue(mockLanguage as any);

      const query: GetLanguageDto = { id: 1 };
      const result = await controller.getLanguage(query);

      expect(mockService.getLanguage).toHaveBeenCalledWith(1);
      expect(result).toEqual({ data: { languageArr: mockLanguage } });
    });

    it('should return empty array when no languages found', async () => {
      mockService.getLanguage.mockResolvedValue([]);

      const query: GetLanguageDto = { id: 999 };
      const result = await controller.getLanguage(query);

      expect(result).toEqual({ data: { languageArr: [] } });
    });

    it('should throw InternalServerErrorException when service throws an error', async () => {
      mockService.getLanguage.mockRejectedValue(new Error('Database error'));

      const query: GetLanguageDto = {};

      await expect(controller.getLanguage(query)).rejects.toThrow(InternalServerErrorException);
      await expect(controller.getLanguage(query)).rejects.toThrow('Internal server error');
    });

    it('should handle numeric string id from query params', async () => {
      const mockLanguage = [{ id: 2, name: 'Spanish' }];
      mockService.getLanguage.mockResolvedValue(mockLanguage as any);

      // Query params often come as strings and are transformed by DTO
      const query: GetLanguageDto = { id: 2 };
      const result = await controller.getLanguage(query);

      expect(mockService.getLanguage).toHaveBeenCalledWith(2);
      expect(result).toEqual({ data: { languageArr: mockLanguage } });
    });

    it('should return multiple languages in correct order', async () => {
      const mockLanguages = [
        { id: 1, name: 'English' },
        { id: 2, name: 'Spanish' },
      ];
      mockService.getLanguage.mockResolvedValue(mockLanguages as any);

      const result = await controller.getLanguage({});

      expect(result.data.languageArr).toHaveLength(2);
      expect(result.data.languageArr[0].id).toBe(1);
      expect(result.data.languageArr[1].id).toBe(2);
    });
  });
});
