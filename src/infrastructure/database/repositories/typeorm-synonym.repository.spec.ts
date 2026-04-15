import { Repository } from 'typeorm';

import { Synonym } from '@/infrastructure/database/entities/synonym.entity';

import { TypeOrmSynonymRepository } from './typeorm-synonym.repository';

interface SynonymOrmRepositoryMock {
  findOne(options: { where: { text: string; language_id: number } }): Promise<Synonym | null>;
  create(entity: Partial<Synonym>): Synonym;
  save(entity: Synonym): Promise<Synonym>;
}

describe('TypeOrmSynonymRepository', () => {
  let repository: TypeOrmSynonymRepository;
  let mockRepository: jest.Mocked<SynonymOrmRepositoryMock>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    repository = new TypeOrmSynonymRepository(mockRepository as unknown as Repository<Synonym>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the mapped synonym when it finds one by text and language', async () => {
    mockRepository.findOne.mockResolvedValue(createSynonymEntity());

    const result = await repository.findByTextAndLanguage('hello', 1);

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { text: 'hello', language_id: 1 },
    });
    expect(result).toEqual({
      id: 3,
      text: 'hello',
      synonymArr: ['hi', 'hey'],
      languageId: 1,
    });
  });

  it('should return null when no synonym matches the query', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(repository.findByTextAndLanguage('missing', 1)).resolves.toBeNull();
  });

  it('should create and save a mapped synonym record', async () => {
    const createdEntity = createSynonymEntity({ id: 0 });
    const savedEntity = createSynonymEntity();
    mockRepository.create.mockReturnValue(createdEntity);
    mockRepository.save.mockResolvedValue(savedEntity);

    const result = await repository.save({
      text: 'hello',
      synonymArr: ['hi', 'hey'],
      languageId: 1,
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      text: 'hello',
      synonym_arr: ['hi', 'hey'],
      language_id: 1,
    });
    expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
    expect(result).toEqual({
      id: 3,
      text: 'hello',
      synonymArr: ['hi', 'hey'],
      languageId: 1,
    });
  });
});

function createSynonymEntity(overrides: Partial<Synonym> = {}): Synonym {
  return {
    id: 3,
    text: 'hello',
    synonym_arr: ['hi', 'hey'],
    language_id: 1,
    language: undefined as never,
    ...overrides,
  };
}
