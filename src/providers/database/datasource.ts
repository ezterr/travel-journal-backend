import { DataSource, DataSourceOptions } from 'typeorm';

export const connectionSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  username: 'root',
  password: '',
  database: 'travel_journal',
  entities: [
    'dist/**/**/**/**.entity{.ts,.js}',
    'dist/**/**/**.entity{.ts,.js}',
    'dist/**/**.entity{.ts,.js}',
  ],
  bigNumberStrings: false,
  // logging: true,
  migrations: ['dist/database/migrations/*.js'],
  synchronize: true,
  autoLoadEntities: true,
  extra: {
    decimalNumbers: true,
  },
  cli: {
    migrationsDir: 'migrations',
  },
} as DataSourceOptions);
