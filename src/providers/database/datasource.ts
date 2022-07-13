import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from '../../config/config';

export const connectionSource = new DataSource({
  type: 'mysql',
  host: config.dbHost,
  port: config.dbPort,
  username: config.dbUsername,
  password: config.dbPassword,
  database: config.dbDatabase,
  entities: [
    'dist/**/**/**/**.entity{.ts,.js}',
    'dist/**/**/**.entity{.ts,.js}',
    'dist/**/**.entity{.ts,.js}',
  ],
  bigNumberStrings: false,
  logging: config.dbLogging,
  migrations: ['dist/database/migrations/*.js'],
  synchronize: config.dbSynchronize,
  autoLoadEntities: true,
  extra: {
    decimalNumbers: true,
  },
  cli: {
    migrationsDir: 'migrations',
  },
} as DataSourceOptions);
