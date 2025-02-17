import { queryDatabase } from '../databases/postgres';

const getLanguage = async (id: number | 'ANY' = 'ANY', columnArr = ['*']): Promise<(Record<string, unknown> | undefined)[]> => {
  const valueArr: unknown[] = [];
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2) + ' FROM language';

  if (id !== 'ANY') {
    valueArr.push(id);
    query += ` WHERE id = $${valueArr.length}`;
  }

  return (await queryDatabase(query, valueArr)).rows;
};

const getLanguageByName = async (name: string, columnArr = ['*']): Promise<Record<string, unknown> | undefined> => {
  let query = 'SELECT ';

  columnArr.forEach((column) => {
    query += `${column}, `;
  });

  query = query.slice(0, -2) + ' FROM language WHERE LOWER(name) = LOWER($1)';

  return (await queryDatabase(query, [name])).rows[0];
};

export default { getLanguage, getLanguageByName };
