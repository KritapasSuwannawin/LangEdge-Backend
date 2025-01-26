import { queryDatabase } from '../utils/postgres';

export const getLanguage = async (id: number | 'ANY' = 'ANY', columnArr = ['*']): Promise<(Record<string, unknown> | undefined)[]> => {
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2);

  if (id === 'ANY') {
    query += ` FROM language;`;
    return (await queryDatabase(query)).rows;
  }

  query += ` FROM language WHERE id = $1;`;
  return (await queryDatabase(query, [id])).rows;
};

export default { getLanguage };
