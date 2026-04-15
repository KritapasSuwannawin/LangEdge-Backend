import { Repository } from 'typeorm';

import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';

import { TypeOrmExampleSentenceRepository } from './typeorm-example-sentence.repository';

interface ExampleSentenceOrmRepositoryMock {
  findOne(options: { where: { text: string; language_id: number; output_language_id: number } }): Promise<ExampleSentence | null>;
  create(entity: Partial<ExampleSentence>): ExampleSentence;
  save(entity: ExampleSentence): Promise<ExampleSentence>;
}

describe('TypeOrmExampleSentenceRepository', () => {
  let repository: TypeOrmExampleSentenceRepository;
  let mockRepository: jest.Mocked<ExampleSentenceOrmRepositoryMock>;

  beforeEach(() => {
    mockRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    repository = new TypeOrmExampleSentenceRepository(mockRepository as unknown as Repository<ExampleSentence>);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the mapped example sentence when it finds one by text and languages', async () => {
    mockRepository.findOne.mockResolvedValue(createExampleSentenceEntity());

    const result = await repository.findByTextAndLanguages('hello', 1, 2);

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { text: 'hello', language_id: 1, output_language_id: 2 },
    });
    expect(result).toEqual({
      id: 7,
      text: 'hello',
      exampleSentenceTranslationIdArr: [11, 12],
      languageId: 1,
      outputLanguageId: 2,
    });
  });

  it('should return null when no example sentence matches the query', async () => {
    mockRepository.findOne.mockResolvedValue(null);

    await expect(repository.findByTextAndLanguages('missing', 1, 2)).resolves.toBeNull();
  });

  it('should create and save a mapped example sentence record', async () => {
    const createdEntity = createExampleSentenceEntity({ id: 0 });
    const savedEntity = createExampleSentenceEntity();
    mockRepository.create.mockReturnValue(createdEntity);
    mockRepository.save.mockResolvedValue(savedEntity);

    const result = await repository.save({
      text: 'hello',
      languageId: 1,
      outputLanguageId: 2,
      exampleSentenceTranslationIdArr: [11, 12],
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      text: 'hello',
      language_id: 1,
      output_language_id: 2,
      example_sentence_translation_id_arr: [11, 12],
    });
    expect(mockRepository.save).toHaveBeenCalledWith(createdEntity);
    expect(result).toEqual({
      id: 7,
      text: 'hello',
      exampleSentenceTranslationIdArr: [11, 12],
      languageId: 1,
      outputLanguageId: 2,
    });
  });
});

function createExampleSentenceEntity(overrides: Partial<ExampleSentence> = {}): ExampleSentence {
  return {
    id: 7,
    text: 'hello',
    example_sentence_translation_id_arr: [11, 12],
    language_id: 1,
    language: undefined as never,
    output_language_id: 2,
    outputLanguage: undefined as never,
    ...overrides,
  };
}
