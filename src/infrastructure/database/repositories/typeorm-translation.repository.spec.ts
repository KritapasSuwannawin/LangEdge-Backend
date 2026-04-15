import { Repository } from 'typeorm';

import { Translation } from '@/infrastructure/database/entities/translation.entity';

import { TypeOrmTranslationRepository } from '@/infrastructure/database/repositories/typeorm-translation.repository';

interface TranslationOrmRepositoryMock {
  findOne(options: { where: { input_text: string; input_language_id: number; output_language_id: number } }): Promise<Translation | null>;
  find(options: { where: { id: unknown } }): Promise<Translation[]>;
  create(entity: Partial<Translation>): Translation;
  save(entity: Translation): Promise<Translation>;
}

describe('TypeOrmTranslationRepository', () => {
  let repository: TypeOrmTranslationRepository;
  let mockRepository: jest.Mocked<TranslationOrmRepositoryMock>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    repository = new TypeOrmTranslationRepository(mockRepository as unknown as Repository<Translation>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the mapped translation when it finds one by input text and languages', async () => {
    mockRepository.findOne.mockResolvedValue(createTranslationEntity());

    const result = await repository.findByInputAndLanguages('hello', 1, 2);

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: {
        input_text: 'hello',
        input_language_id: 1,
        output_language_id: 2,
      },
    });
    expect(result).toEqual({
      id: 4,
      inputText: 'hello',
      inputLanguageId: 1,
      outputText: 'hola',
      outputLanguageId: 2,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });

  it('should return null when no translation matches the query', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(repository.findByInputAndLanguages('missing', 1, 2)).resolves.toBeNull();
  });

  it('should return an empty array without querying when the id list is empty', async () => {
    const result = await repository.findByIds([]);

    expect(result).toEqual([]);
    expect(mockRepository.find).not.toHaveBeenCalled();
  });

  it('should preserve requested order and duplicates while skipping missing ids', async () => {
    const firstTranslation = createTranslationEntity({ id: 4, input_text: 'first', output_text: 'primero' });
    const secondTranslation = createTranslationEntity({ id: 9, input_text: 'second', output_text: 'segundo' });
    mockRepository.find.mockResolvedValue([firstTranslation, secondTranslation]);

    const result = await repository.findByIds([9, 999, 9, 4]);

    expect(mockRepository.find).toHaveBeenCalledWith({ where: { id: expect.any(Object) } });
    expect(result).toEqual([
      {
        id: 9,
        inputText: 'second',
        inputLanguageId: 1,
        outputText: 'segundo',
        outputLanguageId: 2,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 9,
        inputText: 'second',
        inputLanguageId: 1,
        outputText: 'segundo',
        outputLanguageId: 2,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
      {
        id: 4,
        inputText: 'first',
        inputLanguageId: 1,
        outputText: 'primero',
        outputLanguageId: 2,
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
      },
    ]);
  });

  it('should create and save a mapped translation record', async () => {
    const createdEntity = createTranslationEntity({ id: 0 });
    const savedEntity = createTranslationEntity();
    mockRepository.create.mockReturnValue(createdEntity);
    mockRepository.save.mockResolvedValue(savedEntity);

    const result = await repository.save({
      inputText: 'hello',
      inputLanguageId: 1,
      outputText: 'hola',
      outputLanguageId: 2,
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      input_text: 'hello',
      input_language_id: 1,
      output_text: 'hola',
      output_language_id: 2,
    });
    expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
    expect(result).toEqual({
      id: 4,
      inputText: 'hello',
      inputLanguageId: 1,
      outputText: 'hola',
      outputLanguageId: 2,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
    });
  });
});

function createTranslationEntity(overrides: Partial<Translation> = {}): Translation {
  return {
    id: 4,
    input_text: 'hello',
    input_language_id: 1,
    inputLanguage: undefined as never,
    output_text: 'hola',
    output_language_id: 2,
    outputLanguage: undefined as never,
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    ...overrides,
  };
}
