import { queryDatabase } from '../database/postgres';

const insertTranslation = async (
  inputText: string,
  inputLanguageId: number,
  outputText: string,
  outputLanguageId: number
): Promise<number> => {
  const query = `INSERT INTO translation_${inputLanguageId} (input_text, input_language_id, output_text, output_language_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;

  return (await queryDatabase(query, [inputText, inputLanguageId, outputText, outputLanguageId])).rows[0].id;
};

const getTranslation = async (id: number | 'ANY' = 'ANY', columnArr = ['*']): Promise<(Record<string, unknown> | undefined)[]> => {
  const valueArr: unknown[] = [];
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2) + ' FROM translation';

  if (id !== 'ANY') {
    valueArr.push(id);
    query += ` WHERE id = $${valueArr.length}`;
  }

  return (await queryDatabase(query, valueArr)).rows;
};

const getTranslationByText = async (
  inputText: string,
  inputLanguageId: number,
  outputLanguageId: number,
  columnArr = ['*']
): Promise<Record<string, unknown> | undefined> => {
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2) + ` FROM translation_${inputLanguageId} WHERE LOWER(input_text) = LOWER($1) AND output_language_id = $2`;

  return (await queryDatabase(query, [inputText, outputLanguageId])).rows[0];
};

export default { insertTranslation, getTranslation, getTranslationByText };
