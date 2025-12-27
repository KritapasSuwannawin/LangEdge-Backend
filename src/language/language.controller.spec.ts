import { LanguageController } from './language.controller';

describe('LanguageController', () => {
  let controller: LanguageController;
  const mockService: any = { getLanguage: jest.fn() };

  beforeEach(() => {
    mockService.getLanguage.mockReset();
    controller = new LanguageController(mockService as any);
  });

  test('getLanguage returns data wrapper', async () => {
    mockService.getLanguage.mockResolvedValue([{ id: 1, name: 'English' }]);
    const res = await controller.getLanguage({} as any);
    expect(mockService.getLanguage).toHaveBeenCalled();
    expect(res).toEqual({ data: { languageArr: [{ id: 1, name: 'English' }] } });
  });
});
