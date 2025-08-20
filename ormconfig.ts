import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_CONNECTION_STRING,
  entities: ['src/infrastructure/database/entities/*.entity.ts'],
  migrations: ['src/infrastructure/database/migrations/*.ts'],
  synchronize: false,
});
