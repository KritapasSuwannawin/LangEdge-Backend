import { queryDatabase } from '../database/postgres';

const insertSynonym = async (text: string, synonymArr: string[], languageId: number): Promise<number> => {
  const query = `INSERT INTO synonym_${languageId} (text, synonym_arr, language_id)
                VALUES ($1, $2, $3)
                RETURNING id`;

  return (await queryDatabase(query, [text, synonymArr, languageId])).rows[0].id;
};

const getSynonymByText = async (text: string, languageId: number, columnArr = ['*']): Promise<Record<string, unknown> | undefined> => {
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2) + ` FROM synonym_${languageId} WHERE LOWER(text) = LOWER($1)`;

  return (await queryDatabase(query, [text])).rows[0];
};

export default { insertSynonym, getSynonymByText };
