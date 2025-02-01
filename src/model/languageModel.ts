import { queryDatabase } from '../utils/postgres';

export const getLanguage = async (id: number | 'ANY' = 'ANY', columnArr = ['*']): Promise<(Record<string, unknown> | undefined)[]> => {
  const valueArr: unknown[] = [];
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column.trim()}, `;
  });

  query = query.slice(0, -2) + ' FROM language';

  if (id !== 'ANY') {
    valueArr.push(id);
    query += ` WHERE id = $${valueArr.length}`;
  }

  return (await queryDatabase(query, valueArr)).rows;
};

export default { getLanguage };
