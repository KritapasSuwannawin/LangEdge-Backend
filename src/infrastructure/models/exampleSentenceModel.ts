import { queryDatabase } from '../database/postgres';

const insertExampleSentence = async (
  text: string,
  exampleSentenceTranslationIdArr: number[],
  languageId: number,
  outputLanguageId: number
): Promise<number> => {
  const query = `INSERT INTO example_sentence_${languageId} (text, example_sentence_translation_id_arr, language_id, output_language_id)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;

  return (await queryDatabase(query, [text, exampleSentenceTranslationIdArr, languageId, outputLanguageId])).rows[0].id;
};

const getExampleSentenceByText = async (
  text: string,
  languageId: number,
  outputLanguageId: number,
  columnArr = ['*']
): Promise<Record<string, unknown> | undefined> => {
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2) + ` FROM example_sentence_${languageId} WHERE LOWER(text) = LOWER($1) AND output_language_id = $2`;

  return (await queryDatabase(query, [text, outputLanguageId])).rows[0];
};

export default { insertExampleSentence, getExampleSentenceByText };
