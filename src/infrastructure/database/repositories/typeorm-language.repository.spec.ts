import { Repository } from 'typeorm';

import { Language } from '@/infrastructure/database/entities/language.entity';

import { TypeOrmLanguageRepository } from './typeorm-language.repository';

interface LanguageOrmRepositoryMock {
  findOne(options: { where: { id?: number; name?: string } }): Promise<Language | null>;
  find(): Promise<Language[]>;
}

describe('TypeOrmLanguageRepository', () => {
  let repository: TypeOrmLanguageRepository;
  let mockRepository: jest.Mocked<LanguageOrmRepositoryMock>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    repository = new TypeOrmLanguageRepository(mockRepository as unknown as Repository<Language>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the mapped language when it finds one by id', async () => {
    mockRepository.findOne.mockResolvedValue(createLanguageEntity());

    const result = await repository.findById(1);

    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toEqual({ id: 1, name: 'English', code: 'en' });
  });

  it('should return null when no language matches the id', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById(999)).resolves.toBeNull();
  });

  it('should return the mapped language when it finds one by name', async () => {
    mockRepository.findOne.mockResolvedValue(createLanguageEntity({ id: 2, name: 'Spanish', code: 'es' }));

    const result = await repository.findByName('Spanish');

    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { name: 'Spanish' } });
    expect(result).toEqual({ id: 2, name: 'Spanish', code: 'es' });
  });

  it('should map every language returned by findAll', async () => {
    mockRepository.find.mockResolvedValue([createLanguageEntity(), createLanguageEntity({ id: 2, name: 'Spanish', code: 'es' })]);

    const result = await repository.findAll();

    expect(mockRepository.find).toHaveBeenCalledTimes(1);
    expect(result).toEqual([
      { id: 1, name: 'English', code: 'en' },
      { id: 2, name: 'Spanish', code: 'es' },
    ]);
  });
});

function createLanguageEntity(overrides: Partial<Language> = {}): Language {
  return {
    id: 1,
    name: 'English',
    code: 'en',
    ...overrides,
  };
}
