import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

// Used by the TypeORM CLI for generating and running migrations.
// Run: npm run migration:generate -- src/migrations/NameHere
//      npm run migration:run
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'skora_rms',
  ssl: { rejectUnauthorized: false },
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'typeorm_migrations',
});
