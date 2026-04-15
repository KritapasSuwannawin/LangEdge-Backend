import { Repository } from 'typeorm';

import { User } from '@/infrastructure/database/entities/user.entity';

import { TypeOrmUserRepository } from '@/infrastructure/database/repositories/typeorm-user.repository';

interface UserOrmRepositoryMock {
  findOne(options: { where: { id: string } }): Promise<User | null>;
  create(entity: Partial<User>): User;
  save(entity: User): Promise<User>;
  update(criteria: { id: string }, partialEntity: { last_used_language_id: number | null }): Promise<void>;
}

describe('TypeOrmUserRepository', () => {
  let repository: TypeOrmUserRepository;
  let mockRepository: jest.Mocked<UserOrmRepositoryMock>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    repository = new TypeOrmUserRepository(mockRepository as unknown as Repository<User>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the mapped user when it finds one by id', async () => {
    mockRepository.findOne.mockResolvedValue(createUserEntity());

    const result = await repository.findById('user-1');

    expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      pictureUrl: 'https://example.com/picture.png',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      lastUsedLanguageId: 2,
    });
  });

  it('should return null when no user matches the id', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(repository.findById('missing-user')).resolves.toBeNull();
  });

  it('should create and save a new user when no persisted user exists', async () => {
    const createdEntity = createUserEntity({ picture_url: null, last_used_language_id: null });
    const savedEntity = createUserEntity({ picture_url: null, last_used_language_id: null });
    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockReturnValue(createdEntity);
    mockRepository.save.mockResolvedValue(savedEntity);

    const result = await repository.upsert({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      pictureUrl: null,
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      picture_url: null,
    });
    expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
    expect(result?.pictureUrl).toBeNull();
    expect(result?.lastUsedLanguageId).toBeNull();
  });

  it('should update an existing user and preserve the current picture when pictureUrl is null', async () => {
    const existingEntity = createUserEntity();
    const savedEntity = createUserEntity({ email: 'new@example.com', name: 'Updated User' });
    mockRepository.findOne.mockResolvedValue(existingEntity);
    mockRepository.save.mockResolvedValue(savedEntity);

    const result = await repository.upsert({
      id: 'user-1',
      email: 'new@example.com',
      name: 'Updated User',
      pictureUrl: null,
    });

    expect(existingEntity.picture_url).toBe('https://example.com/picture.png');
    expect(mockRepository.create).not.toHaveBeenCalled();
    expect(mockRepository.save).toHaveBeenCalledWith(existingEntity);
    expect(result).toEqual({
      id: 'user-1',
      email: 'new@example.com',
      name: 'Updated User',
      pictureUrl: 'https://example.com/picture.png',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      lastUsedLanguageId: 2,
    });
  });

  it('should update the stored picture when pictureUrl is provided', async () => {
    const existingEntity = createUserEntity({ picture_url: null });
    const savedEntity = createUserEntity({ picture_url: 'https://example.com/new-picture.png' });
    mockRepository.findOne.mockResolvedValue(existingEntity);
    mockRepository.save.mockResolvedValue(savedEntity);

    const result = await repository.upsert({
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      pictureUrl: 'https://example.com/new-picture.png',
    });

    expect(existingEntity.picture_url).toBe('https://example.com/new-picture.png');
    expect(result?.pictureUrl).toBe('https://example.com/new-picture.png');
  });

  it('should forward updateLastUsedLanguageId to the orm repository', async () => {
    mockRepository.update.mockResolvedValue(undefined);

    await repository.updateLastUsedLanguageId('user-1', 3);

    expect(mockRepository.update).toHaveBeenCalledWith({ id: 'user-1' }, { last_used_language_id: 3 });
  });
});

function createUserEntity(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    picture_url: 'https://example.com/picture.png',
    created_at: new Date('2024-01-01T00:00:00.000Z'),
    last_used_language_id: 2,
    lastUsedLanguage: undefined,
    ...overrides,
  };
}
