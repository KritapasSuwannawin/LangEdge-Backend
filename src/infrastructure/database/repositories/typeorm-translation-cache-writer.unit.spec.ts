import { DataSource } from 'typeorm';

import { ExampleSentence } from '@/infrastructure/database/entities/example-sentence.entity';
import { Synonym } from '@/infrastructure/database/entities/synonym.entity';
import { Translation } from '@/infrastructure/database/entities/translation.entity';
import type { SaveShortTranslationCacheInput } from '@/repositories/translate/i-translation-cache-writer';

import { TypeOrmTranslationCacheWriter } from './typeorm-translation-cache-writer';

interface InsertQueryBuilderMock {
  insert(): InsertQueryBuilderMock;
  into(entity: object): InsertQueryBuilderMock;
  values(values: Record<string, unknown>): InsertQueryBuilderMock;
  orIgnore(): InsertQueryBuilderMock;
  execute(): Promise<void>;
}

interface QueryRunnerManagerMock {
  save(target: object, entity: Record<string, unknown>): Promise<Record<string, unknown>>;
  createQueryBuilder(): InsertQueryBuilderMock;
}

interface QueryRunnerMock {
  connect(): Promise<void>;
  startTransaction(): Promise<void>;
  commitTransaction(): Promise<void>;
  rollbackTransaction(): Promise<void>;
  release(): Promise<void>;
  manager: jest.Mocked<QueryRunnerManagerMock>;
}

interface DataSourceMock {
  createQueryRunner(): QueryRunnerMock;
}

describe('TypeOrmTranslationCacheWriter', () => {
  let writer: TypeOrmTranslationCacheWriter;
  let mockDataSource: jest.Mocked<DataSourceMock>;
  let mockQueryRunner: jest.Mocked<QueryRunnerMock>;
  let mockManager: jest.Mocked<QueryRunnerManagerMock>;
  let mockInsertQueryBuilder: jest.Mocked<InsertQueryBuilderMock>;

  beforeEach(() => {
    mockInsertQueryBuilder = {
      insert: jest.fn(),
      into: jest.fn(),
      values: jest.fn(),
      orIgnore: jest.fn(),
      execute: jest.fn(),
    };
    mockInsertQueryBuilder.insert.mockReturnValue(mockInsertQueryBuilder);
    mockInsertQueryBuilder.into.mockReturnValue(mockInsertQueryBuilder);
    mockInsertQueryBuilder.values.mockReturnValue(mockInsertQueryBuilder);
    mockInsertQueryBuilder.orIgnore.mockReturnValue(mockInsertQueryBuilder);
    mockInsertQueryBuilder.execute.mockResolvedValue(undefined);

    mockManager = {
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };
    mockManager.createQueryBuilder.mockReturnValue(mockInsertQueryBuilder);
    mockManager.save.mockImplementation(async (target, entity) => {
      if (target === Translation) {
        const inputText = entity.input_text;
        const id = inputText === 'hello friend' ? 102 : 101;
        return { id, ...entity };
      }

      if (target === ExampleSentence) {
        return { id: 500, ...entity };
      }

      throw new Error('Unexpected entity target');
    });

    mockQueryRunner = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: mockManager,
    };
    mockQueryRunner.connect.mockResolvedValue(undefined);
    mockQueryRunner.startTransaction.mockResolvedValue(undefined);
    mockQueryRunner.commitTransaction.mockResolvedValue(undefined);
    mockQueryRunner.rollbackTransaction.mockResolvedValue(undefined);
    mockQueryRunner.release.mockResolvedValue(undefined);

    mockDataSource = {
      createQueryRunner: jest.fn(),
    };
    mockDataSource.createQueryRunner.mockReturnValue(mockQueryRunner);

    writer = new TypeOrmTranslationCacheWriter(mockDataSource as unknown as DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should persist the short-translation cache within one transaction', async () => {
    await writer.saveShortTranslationCache(createCacheInput());

    expect(mockDataSource.createQueryRunner).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.connect).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.startTransaction).toHaveBeenCalledTimes(1);
    expect(mockManager.save.mock.calls.map(([target]) => target)).toEqual([Translation, Translation, ExampleSentence, Translation]);
    expect(mockManager.save.mock.calls[2]?.[1]).toEqual({
      text: 'hello',
      example_sentence_translation_id_arr: [101, 102],
      language_id: 1,
      output_language_id: 2,
    });
    expect(mockInsertQueryBuilder.into).toHaveBeenNthCalledWith(1, Synonym);
    expect(mockInsertQueryBuilder.values).toHaveBeenNthCalledWith(1, {
      text: 'hello',
      synonym_arr: ['hi', 'hey'],
      language_id: 1,
    });
    expect(mockInsertQueryBuilder.values).toHaveBeenNthCalledWith(2, {
      text: 'hola',
      synonym_arr: ['saludo'],
      language_id: 2,
    });
    expect(mockInsertQueryBuilder.execute).toHaveBeenCalledTimes(2);
    expect(mockQueryRunner.commitTransaction).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
  });

  it('should roll back and release the query runner when persistence fails', async () => {
    const persistenceError = new Error('Save failed');
    mockManager.save.mockRejectedValueOnce(persistenceError);

    await expect(writer.saveShortTranslationCache(createCacheInput())).rejects.toBe(persistenceError);

    expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalledTimes(1);
    expect(mockQueryRunner.release).toHaveBeenCalledTimes(1);
    expect(mockInsertQueryBuilder.execute).not.toHaveBeenCalled();
  });
});

function createCacheInput(): SaveShortTranslationCacheInput {
  return {
    inputText: 'hello',
    inputLanguageId: 1,
    outputText: 'hola',
    outputLanguageId: 2,
    inputTextSynonymArr: ['hi', 'hey'],
    translationSynonymArr: ['saludo'],
    exampleSentenceArr: [
      { sentence: 'hello world', translation: 'hola mundo' },
      { sentence: 'hello friend', translation: 'hola amigo' },
    ],
  };
}
