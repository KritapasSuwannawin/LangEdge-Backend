import { TranslateController } from './translate.controller';

describe('TranslateController', () => {
  let controller: TranslateController;
  const mockService: any = { getTranslation: jest.fn() };

  beforeEach(() => {
    mockService.getTranslation.mockReset();
    controller = new TranslateController(mockService as any);
  });

  test('getTranslation returns wrapped data when service resolves', async () => {
    mockService.getTranslation.mockResolvedValue({ translation: 'Hola' });
    const res = await controller.getTranslation({ text: 'Hi', outputLanguageId: 2 } as any);
    expect(mockService.getTranslation).toHaveBeenCalled();
    expect(res).toEqual({ data: { translation: 'Hola' } });
  });
});
