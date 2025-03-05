import { queryDatabase } from '../databases/postgres';

const insertUser = async (id: string, email: string, name: string, picture_url: string | null): Promise<string> => {
  const query = `INSERT INTO "user" (id, email, name, picture_url)
                VALUES ($1, $2, $3, $4)
                RETURNING id`;

  return (await queryDatabase(query, [id, email, name, picture_url])).rows[0].id;
};

const updateUser = async (id: string, columnValueMap: Record<string, unknown>): Promise<Record<string, unknown>> => {
  let query = 'UPDATE "user" SET ';
  const valueArr: unknown[] = [id];

  Object.entries(columnValueMap).forEach(([column, value], index) => {
    query += `${column} = $${index + 2}, `;
    valueArr.push(value);
  });

  query = query.slice(0, -2) + ' WHERE id = $1 RETURNING *';

  return (await queryDatabase(query, valueArr)).rows[0];
};

export default { insertUser, updateUser };
