import { Repository } from 'typeorm';

import { LanguageService } from './language.service';

import { Language } from '../infrastructure/database/entities/language.entity';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockRepo: jest.Mocked<Pick<Repository<Language>, 'find'>>;

  beforeEach(() => {
    mockRepo = {
      find: jest.fn(),
    };
    service = new LanguageService(mockRepo as unknown as Repository<Language>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getLanguage', () => {
    it('should call find with where clause when id is provided', async () => {
      const mockLanguage = [{ id: 1, name: 'English' }] as Language[];
      mockRepo.find.mockResolvedValue(mockLanguage);

      const result = await service.getLanguage(1);

      expect(mockRepo.find).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLanguage);
    });

    it('should call find without arguments when id is not provided', async () => {
      const mockLanguages = [
        { id: 1, name: 'English' },
        { id: 2, name: 'Spanish' },
      ] as Language[];
      mockRepo.find.mockResolvedValue(mockLanguages);

      const result = await service.getLanguage();

      expect(mockRepo.find).toHaveBeenCalledWith();
      expect(mockRepo.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockLanguages);
    });

    it('should call find without arguments when id is undefined', async () => {
      const mockLanguages = [{ id: 1, name: 'English' }] as Language[];
      mockRepo.find.mockResolvedValue(mockLanguages);

      const result = await service.getLanguage(undefined);

      expect(mockRepo.find).toHaveBeenCalledWith();
      expect(result).toEqual(mockLanguages);
    });

    it('should return empty array when no languages are found with specific id', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getLanguage(999);

      expect(mockRepo.find).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(result).toEqual([]);
    });

    it('should return empty array when database has no languages', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await service.getLanguage();

      expect(result).toEqual([]);
    });

    it('should propagate database errors', async () => {
      mockRepo.find.mockRejectedValue(new Error('Database connection failed'));

      await expect(service.getLanguage()).rejects.toThrow('Database connection failed');
    });

    it('should return languages with all their properties', async () => {
      const mockLanguages = [
        { id: 1, name: 'English', code: 'en' },
        { id: 2, name: 'Spanish', code: 'es' },
      ] as Language[];
      mockRepo.find.mockResolvedValue(mockLanguages);

      const result = await service.getLanguage();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id', 1);
      expect(result[0]).toHaveProperty('name', 'English');
      expect(result[1]).toHaveProperty('id', 2);
      expect(result[1]).toHaveProperty('name', 'Spanish');
    });
  });
});
