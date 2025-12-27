import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  const mockRepo: any = { find: jest.fn() };

  beforeEach(() => {
    mockRepo.find.mockReset();
    service = new LanguageService(mockRepo as any);
  });

  test('getLanguage with id calls find with where', async () => {
    mockRepo.find.mockResolvedValue([{ id: 1, name: 'English' }]);

    const res = await service.getLanguage(1);
    expect(mockRepo.find).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(res).toEqual([{ id: 1, name: 'English' }]);
  });

  test('getLanguage without id calls find with no args', async () => {
    mockRepo.find.mockResolvedValue([{ id: 1 }]);
    const res = await service.getLanguage();
    expect(mockRepo.find).toHaveBeenCalled();
    expect(res).toEqual([{ id: 1 }]);
  });
});
